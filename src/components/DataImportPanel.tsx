/**
 * DataImportPanel.tsx
 * Drag-and-drop multi-format data import panel.
 * Supports CSV, XLSX, GeoJSON, Parquet, GeoParquet.
 * Saves imported datasets to IndexedDB via storageService.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Upload, FileText, Table2, CheckCircle2, AlertCircle,
    X, ChevronRight, Plus, FolderOpen, Trash2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useDuckDB } from '@/contexts/DuckDBContext';
import {
    parseFile, autoDetectMapping, SUPPORTED_EXTENSIONS, SUPPORTED_LABEL,
    type ParseResult
} from '@/utils/fileParser';
import {
    getProjects, saveDataset, getDatasets, deleteDataset, generateId,
    StoredProject, StoredDataset, ColumnMapping
} from '@/services/storageService';
import ProjectModal from './ProjectModal';
import { saveProject } from '@/services/storageService';

// ─── Steps ───────────────────────────────────────────────────────────────────

type Step = 'select' | 'preview' | 'mapping' | 'done';

// ─── Column Mapping Row ───────────────────────────────────────────────────────

const MAPPING_FIELDS: { key: keyof ColumnMapping; label: string; required?: boolean }[] = [
    { key: 'lat', label: 'Latitude', required: false },
    { key: 'lon', label: 'Longitude', required: false },
    { key: 'date', label: 'Data', required: false },
    { key: 'id', label: 'ID', required: false },
    { key: 'name', label: 'Nome do ponto', required: false },
];

// ─── Component ───────────────────────────────────────────────────────────────

const DataImportPanel: React.FC<{ onImportSuccess?: () => void }> = ({ onImportSuccess }) => {
    const { user } = useAuth();
    const { db } = useDuckDB();

    const ownerId = user?.uid ?? 'anonymous';

    // Projects
    const [projects, setProjects] = useState<StoredProject[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [projectLoading, setProjectLoading] = useState(true);

    // Datasets already imported
    const [datasets, setDatasets] = useState<StoredDataset[]>([]);
    const [datasetLoading, setDatasetLoading] = useState(false);

    // Import flow
    const [step, setStep] = useState<Step>('select');
    const [isDragOver, setIsDragOver] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [parsed, setParsed] = useState<ParseResult | null>(null);
    const [mapping, setMapping] = useState<ColumnMapping>({});
    const [importing, setImporting] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Load projects ──────────────────────────────────────────────────────────

    const loadProjects = useCallback(async () => {
        setProjectLoading(true);
        try {
            const list = await getProjects(ownerId);
            list.sort((a, b) => b.createdAt - a.createdAt);
            setProjects(list);

            const storedActive = sessionStorage.getItem('activeProjectId');
            if (storedActive && list.some(p => p.id === storedActive)) {
                setActiveProjectId(storedActive);
            } else if (list.length > 0) {
                setActiveProjectId(list[0].id);
                sessionStorage.setItem('activeProjectId', list[0].id);
            }
        } finally {
            setProjectLoading(false);
        }
    }, [ownerId]);

    useEffect(() => { loadProjects(); }, [loadProjects]);

    // ── Load datasets for active project ──────────────────────────────────────

    const loadDatasets = useCallback(async () => {
        if (!activeProjectId) { setDatasets([]); return; }
        setDatasetLoading(true);
        try {
            const list = await getDatasets(activeProjectId);
            list.sort((a, b) => b.createdAt - a.createdAt);
            setDatasets(list);
        } finally {
            setDatasetLoading(false);
        }
    }, [activeProjectId]);

    useEffect(() => { loadDatasets(); }, [loadDatasets]);

    // ── Pre-load demo CSV ──────────────────────────────────────────────────────

    const loadDemoData = useCallback(async () => {
        if (!activeProjectId) {
            toast.error('Selecione ou crie um projeto primeiro');
            return;
        }
        try {
            const resp = await fetch('/dados_exemplo_poluentes_corrigido.csv');
            if (!resp.ok) throw new Error('Demo CSV not found');
            const blob = await resp.blob();
            const demoFile = new File([blob], 'dados_exemplo_poluentes_corrigido.csv', { type: 'text/csv' });
            await processFile(demoFile);
        } catch {
            toast.error('Não foi possível carregar o arquivo demo');
        }
    }, [activeProjectId]);

    // ── File handling ──────────────────────────────────────────────────────────

    const processFile = useCallback(async (f: File) => {
        setFile(f);
        setParseError(null);
        setStep('preview');
        try {
            const result = await parseFile(f, db ?? undefined);
            setParsed(result);
            setMapping(autoDetectMapping(result.columns));
        } catch (e: any) {
            setParseError(String(e.message ?? e));
            setParsed(null);
        }
    }, [db]);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) processFile(dropped);
    }, [processFile]);

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) processFile(selected);
        e.target.value = '';
    };

    // ── Import to IndexedDB ────────────────────────────────────────────────────

    const handleImport = async () => {
        if (!parsed || !file) return;

        if (!activeProjectId) {
            toast.error('Selecione um projeto para importar');
            setProjectModalOpen(true);
            return;
        }

        setImporting(true);
        try {
            const dataset: StoredDataset = {
                id: generateId('ds'),
                projectId: activeProjectId,
                name: file.name,
                fileType: parsed.fileType,
                columns: parsed.columns,
                mapping,
                rows: parsed.rows,
                recordCount: parsed.rows.length,
                createdAt: Date.now(),
                geojson: parsed.geojson,
            };

            await saveDataset(dataset);
            toast.success(`${parsed.rows.length.toLocaleString()} registros importados com sucesso!`);
            setStep('done');
            await loadDatasets();
            if (onImportSuccess) onImportSuccess();
        } catch (e: any) {
            toast.error(`Erro ao importar: ${e.message}`);
        } finally {
            setImporting(false);
        }
    };

    const handleDeleteDataset = async (id: string) => {
        await deleteDataset(id);
        toast.success('Dataset removido');
        await loadDatasets();
        if (onImportSuccess) onImportSuccess();
    };

    const resetFlow = () => {
        setStep('select');
        setFile(null);
        setParsed(null);
        setMapping({});
        setParseError(null);
    };

    // ── Project creation from modal ────────────────────────────────────────────

    const handleCreateProject = async (data: any) => {
        const now = Date.now();
        const project: StoredProject = {
            id: generateId('proj'),
            ownerId,
            createdAt: now,
            updatedAt: now,
            ...data,
        };
        await saveProject(project);
        await loadProjects();
        setActiveProjectId(project.id);
        sessionStorage.setItem('activeProjectId', project.id);
        toast.success('Projeto criado!');
    };

    // ─── Render ────────────────────────────────────────────────────────────────

    const activeProject = projects.find(p => p.id === activeProjectId);

    return (
        <div className="flex flex-col h-full text-foreground">
            {/* Header */}
            <div className="p-5 border-b border-border">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Upload size={16} className="text-primary" />
                    Importar Dados
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">{SUPPORTED_LABEL}</p>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Project selector */}
                <div className="p-4 border-b border-border">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                        Projeto de destino
                    </label>
                    {projectLoading ? (
                        <div className="text-muted-foreground text-xs flex items-center gap-1">
                            <RefreshCw size={11} className="animate-spin" /> Carregando projetos...
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground flex-1">Nenhum projeto criado.</p>
                            <button
                                onClick={() => setProjectModalOpen(true)}
                                className="text-xs text-primary border border-primary/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-primary/10 transition-colors"
                            >
                                <Plus size={12} /> Criar projeto
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <select
                                className="flex-1 bg-background border border-border text-foreground rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50"
                                value={activeProjectId ?? ''}
                                onChange={e => {
                                    setActiveProjectId(e.target.value);
                                    sessionStorage.setItem('activeProjectId', e.target.value);
                                }}
                            >
                                {projects.map(p => (
                                    <option key={p.id} value={p.id} className="bg-background">
                                        {p.name} {p.visibility === 'public' ? '🌐' : '🔒'}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => setProjectModalOpen(true)}
                                className="p-2 text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                                title="Novo projeto"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Import Steps */}
                <div className="p-4">
                    {/* STEP: File selection */}
                    {step === 'select' && (
                        <div className="flex flex-col gap-4">
                            {/* Drop zone */}
                            <div
                                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={onDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                    'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                                    isDragOver
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border/50 hover:border-primary/40 hover:bg-primary/5'
                                )}
                            >
                                <Upload size={28} className="mx-auto mb-3 text-primary/50" />
                                <p className="text-sm font-semibold text-foreground mb-1">
                                    Arraste um arquivo ou clique para selecionar
                                </p>
                                <p className="text-[11px] text-muted-foreground">{SUPPORTED_LABEL}</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept={SUPPORTED_EXTENSIONS}
                                    className="hidden"
                                    onChange={onFileSelect}
                                />
                            </div>

                            {/* Demo dataset */}
                            <button
                                onClick={loadDemoData}
                                className="w-full text-xs text-muted-foreground hover:text-foreground border border-border hover:border-border/80 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                <FileText size={13} />
                                Carregar dataset de exemplo (IHC Poluentes)
                            </button>
                        </div>
                    )}

                    {/* STEP: Preview */}
                    {step === 'preview' && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText size={15} className="text-primary" />
                                    <span className="text-sm font-semibold text-foreground truncate max-w-[180px]">{file?.name}</span>
                                </div>
                                <button onClick={resetFlow} className="text-muted-foreground hover:text-foreground transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            {parseError ? (
                                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
                                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                    {parseError}
                                </div>
                            ) : parsed ? (
                                <>
                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-card border border-border rounded-lg p-3 text-center">
                                            <div className="text-lg font-bold text-primary">{parsed.rows.length.toLocaleString()}</div>
                                            <div className="text-[10px] text-muted-foreground">Registros</div>
                                        </div>
                                        <div className="bg-card border border-border rounded-lg p-3 text-center">
                                            <div className="text-lg font-bold text-foreground">{parsed.columns.length}</div>
                                            <div className="text-[10px] text-muted-foreground">Colunas</div>
                                        </div>
                                    </div>

                                    {/* Preview table */}
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Table2 size={11} /> Pré-visualização (20 linhas)
                                        </p>
                                        <div className="overflow-x-auto rounded-lg border border-border">
                                            <table className="w-full text-[10px] text-muted-foreground">
                                                <thead>
                                                    <tr className="border-b border-border bg-muted/50">
                                                        {parsed.columns.slice(0, 8).map(col => (
                                                            <th key={col} className="px-2 py-2 text-left font-bold text-primary/80 whitespace-nowrap">
                                                                {col}
                                                            </th>
                                                        ))}
                                                        {parsed.columns.length > 8 && (
                                                            <th className="px-2 py-2 text-muted-foreground">+{parsed.columns.length - 8}</th>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {parsed.rows.slice(0, 20).map((row, i) => (
                                                        <tr key={i} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                                                            {parsed.columns.slice(0, 8).map(col => (
                                                                <td key={col} className="px-2 py-1.5 whitespace-nowrap max-w-[100px] truncate">
                                                                    {String(row[col] ?? '')}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setStep('mapping')}
                                        className="w-full bg-primary/10 border border-primary/30 text-primary text-sm font-semibold py-3 rounded-xl hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        Mapear colunas <ChevronRight size={15} />
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                                    <RefreshCw size={16} className="animate-spin mr-2" />
                                    Processando arquivo...
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP: Column mapping */}
                    {step === 'mapping' && parsed && (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-foreground">Mapeamento de colunas</p>
                                <button onClick={() => setStep('preview')} className="text-muted-foreground hover:text-foreground text-xs">
                                    ← Voltar
                                </button>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Identifique quais colunas correspondem a cada campo. Detection automática aplicada.
                            </p>

                            <div className="flex flex-col gap-2">
                                {MAPPING_FIELDS.map(({ key, label }) => (
                                    <div key={key} className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
                                        <select
                                            className="flex-1 bg-background border border-border text-foreground rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50"
                                            value={mapping[key] ?? ''}
                                            onChange={e => setMapping(m => ({ ...m, [key]: e.target.value || undefined }))}
                                        >
                                            <option value="" className="bg-background">— Não mapeado —</option>
                                            {parsed.columns.map(col => (
                                                <option key={col} value={col} className="bg-background">{col}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleImport}
                                disabled={importing || !activeProjectId}
                                className="w-full bg-primary text-primary-foreground text-sm font-bold py-3 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {importing ? (
                                    <><RefreshCw size={15} className="animate-spin" /> Importando...</>
                                ) : (
                                    <><Upload size={15} /> Importar {parsed.rows.length.toLocaleString()} registros</>
                                )}
                            </button>
                        </div>
                    )}

                    {/* STEP: Done */}
                    {step === 'done' && (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <CheckCircle2 size={40} className="text-primary" />
                            <p className="text-foreground font-bold">Importação concluída!</p>
                            <button
                                onClick={resetFlow}
                                className="bg-primary/10 border border-primary/30 text-primary text-sm px-5 py-2.5 rounded-xl hover:bg-primary/20 transition-all flex items-center gap-2"
                            >
                                <Upload size={14} /> Importar outro arquivo
                            </button>
                        </div>
                    )}
                </div>

                {/* Imported datasets list */}
                {datasets.length > 0 && (
                    <div className="px-4 pb-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <FolderOpen size={11} /> Datasets importados ({datasets.length})
                        </p>
                        <div className="flex flex-col gap-2">
                            {datasets.map(ds => (
                                <div key={ds.id} className="bg-card border border-border rounded-lg px-3 py-2.5 flex items-center gap-3">
                                    <FileText size={14} className="text-primary/60 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-foreground truncate">{ds.name}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {ds.recordCount.toLocaleString()} registros · {ds.fileType.toUpperCase()} · {new Date(ds.createdAt).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteDataset(ds.id)}
                                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                        title="Remover dataset"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Project creation modal */}
            <ProjectModal
                open={projectModalOpen}
                onClose={() => setProjectModalOpen(false)}
                onSave={handleCreateProject}
            />
        </div>
    );
};

export default DataImportPanel;
