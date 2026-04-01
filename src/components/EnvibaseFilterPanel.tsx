import React, { useState, useMemo, useCallback } from 'react';
import { Search, X, ChevronRight, ChevronDown, Star, MapPin, Calendar, Leaf, Waves, Mountain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Data ────────────────────────────────────────────────────────────────

const SCOPE_META = [
    { id: 'meus_projetos', label: 'Meus Projetos', desc: 'Dados e projetos criados por você.', icon: 'person' },
    { id: 'compartilhados', label: 'Compartilhados', desc: 'Projetos recebidos/compartilhados.', icon: 'group' },
    { id: 'favoridos', label: 'Favoritos', desc: 'Atalhos para conjuntos mais usados.', icon: 'star' },
    { id: 'dados_publicos', label: 'Dados Públicos', desc: 'Bases públicas e coleções abertas.', icon: 'public' },
];

const SCOPE_PROJECTS = [
    { scope: 'meus_projetos', name: 'Meu projeto 01', updated: '04/03/2025' },
    { scope: 'meus_projetos', name: 'Meu XPTO 01', updated: '02/02/2026' },
    { scope: 'meus_projetos', name: 'Meu Teste 01', updated: '22/07/2025' },
    { scope: 'meus_projetos', name: 'Meu Encerrado 01', updated: '19/05/2026' },
    { scope: 'compartilhados', name: 'Proj Receb 2025_01_03', updated: '05/01/2025' },
    { scope: 'compartilhados', name: 'Proj Env 2025_01_03', updated: '30/11/2026' },
    { scope: 'compartilhados', name: 'Proj Parcial 2025_01_03', updated: '14/08/2026' },
    { scope: 'compartilhados', name: 'Proj Exp 2025_01_03', updated: '29/12/2025' },
    { scope: 'favoridos', name: 'Natureza 0001 A', updated: '18/09/2025', rating: { stars: 4, count: 904 } },
    { scope: 'favoridos', name: 'Ambiente 024 B', updated: '25/12/2026', rating: { stars: 3, count: 57 } },
    { scope: 'favoridos', name: 'Rios Poluídos 2025', updated: '09/02/2025', rating: { stars: 4, count: 169 } },
    { scope: 'favoridos', name: 'Rio Doce 002', updated: '12/01/2026', rating: { stars: 4, count: 27 } },
    { scope: 'favoridos', name: 'Praias e Lagoas', updated: '30/04/2025', rating: { stars: 4, count: 502 } },
    { scope: 'dados_publicos', name: 'Dados ANA', updated: '15/06/2026', rating: { stars: 5, count: 6525 } },
    { scope: 'dados_publicos', name: 'Dados INEA', updated: '17/11/2025', rating: { stars: 4, count: 527 } },
    { scope: 'dados_publicos', name: 'Dados IBAMA', updated: '04/10/2026', rating: { stars: 5, count: 2307 } },
    { scope: 'dados_publicos', name: 'Dados Rurais', updated: '26/08/2025', rating: { stars: 3, count: 224 } },
    { scope: 'dados_publicos', name: 'Dados GOV BR', updated: '28/04/2026', rating: { stars: 5, count: 5457 } },
    { scope: 'dados_publicos', name: 'Dados Aleatórios', updated: '12/05/2025', rating: { stars: 1, count: 15 } },
    { scope: 'dados_publicos', name: 'Dados Sedimento', updated: '09/09/2026', rating: { stars: 4, count: 85 } },
    { scope: 'dados_publicos', name: 'Dados Biota', updated: '01/01/2026', rating: { stars: 4, count: 221 } },
];

const ENV_META = [
    { id: 'continental', label: 'Continental', icon: Mountain },
    { id: 'costeiro', label: 'Costeiro', icon: Waves },
    { id: 'oceanico', label: 'Oceânico', icon: Waves },
];

const ECO_DATA = [
    { cat: 'Aquático Continental', pt: 'Riacho', en: 'Stream / Creek', desc: "Curso d'água menor que um rio.", env: ['continental'] },
    { cat: 'Aquático Continental', pt: 'Rio', en: 'River', desc: 'Grande curso d\'água natural.', env: ['continental'] },
    { cat: 'Aquático Continental', pt: 'Lago', en: 'Lake', desc: 'Corpo de água cercado por terra.', env: ['continental'] },
    { cat: 'Aquático Continental', pt: 'Lagoa', en: 'Lagoon', desc: 'Extensão de água rasa.', env: ['continental'] },
    { cat: 'Aquático Continental', pt: 'Represa', en: 'Reservoir', desc: 'Corpo de água represado.', env: ['continental'] },
    { cat: 'Costeiro', pt: 'Estuário', en: 'Estuary', desc: 'Corpo semifechado onde rio encontra o mar.', env: ['costeiro'] },
    { cat: 'Costeiro', pt: 'Manguezal', en: 'Mangrove', desc: 'Ecossistema de transição costeiro.', env: ['costeiro'] },
    { cat: 'Costeiro', pt: 'Praia', en: 'Beach', desc: 'Faixa de areia costeira.', env: ['costeiro'] },
    { cat: 'Costeiro', pt: 'Restinga', en: 'Restinga', desc: 'Vegetação costeira sobre dunas.', env: ['costeiro'] },
    { cat: 'Oceânico', pt: 'Atol', en: 'Atoll', desc: 'Anel de recifes de coral.', env: ['oceanico'] },
    { cat: 'Oceânico / Costeiro', pt: 'Mar', en: 'Sea', desc: 'Extensão de água salgada.', env: ['oceanico', 'costeiro'] },
    { cat: 'Oceânico', pt: 'Plataforma Continental', en: 'Continental Shelf', desc: 'Região submersa.', env: ['oceanico'] },
    { cat: 'Continental', pt: 'Solo', en: 'Soil', desc: 'Camada superficial da Terra.', env: ['continental'] },
    { cat: 'Continental', pt: 'Floresta', en: 'Forest', desc: 'Ecossistema florestal.', env: ['continental'] },
    { cat: 'Continental', pt: 'Cerrado', en: 'Savanna', desc: 'Bioma de savana tropical.', env: ['continental'] },
];

const MATRIX_META = [
    { id: 'solo', label: 'Solo' },
    { id: 'sedimento', label: 'Sedimento' },
    { id: 'agua', label: 'Água' },
    { id: 'agua_subterranea', label: 'Água Sub.' },
    { id: 'biota', label: 'Biota' },
];

const BIOTA_META = [
    { id: 'camarao', label: 'Camarão' },
    { id: 'baleia', label: 'Baleia' },
    { id: 'tartaruga', label: 'Tartaruga' },
    { id: 'mexilhao', label: 'Mexilhão' },
    { id: 'caranguejo', label: 'Caranguejo' },
    { id: 'golfinho', label: 'Golfinho' },
    { id: 'pinguim', label: 'Pinguim' },
];

const PARAM_DATA: Record<string, string[]> = {
    'Granulometria': ['Cascalho', 'Areia Grossa', 'Areia Fina', 'Silte', 'Argila'],
    'Matéria Orgânica': ['Carbonatos', 'Matéria Orgânica Total', 'Carbono Orgânico Total', 'Nitrogênio Total', 'Enxofre'],
    'Metais Totais': ['Alumínio (Al)', 'Arsênio (As)', 'Cádmio (Cd)', 'Chumbo (Pb)', 'Cobre (Cu)', 'Ferro (Fe)', 'Mercúrio (Hg)', 'Zinco (Zn)'],
    'Hidrocarbonetos': ['C10', 'C12', 'Pristano', 'Fitano', 'HTP'],
    'HPAs': ['Naftaleno', 'Antraceno', 'Pireno', 'Benzo(a)pireno', 'Sigma HPAs'],
    'Biomarcadores': ['TR19', 'TR20', 'TS', 'TM', 'H30', 'GAM'],
};

// ── Helpers ─────────────────────────────────────────────────────────────

const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const starsText = (n: number) => '★'.repeat(Math.min(5, n)) + '☆'.repeat(5 - Math.min(5, n));

// ── Component ───────────────────────────────────────────────────────────

export default function EnvibaseFilterPanel() {
    // Section collapse state — Projetos Ativos e Matriz iniciam fechados
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
        params: true,
        projects: true,
        eco: true,
        region: true,
        period: true,
        env: true
    });

    const toggleSection = (id: string) => {
        setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Original states
    const [selectedScopes, setSelectedScopes] = useState<Set<string>>(new Set(['dados_publicos']));
    const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
    const [projectSearch, setProjectSearch] = useState('');
    const [country, setCountry] = useState('');
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [activeEnvs, setActiveEnvs] = useState<Set<string>>(new Set());
    const [ecoSearch, setEcoSearch] = useState('');
    const [selectedEcos, setSelectedEcos] = useState<Set<string>>(new Set());
    const [selectedMatrices, setSelectedMatrices] = useState<Set<string>>(new Set());
    const [selectedBiota, setSelectedBiota] = useState<Set<string>>(new Set());
    const [paramSearch, setParamSearch] = useState('');
    const [selectedParams, setSelectedParams] = useState<Set<string>>(new Set());
    const [openParamCats, setOpenParamCats] = useState<Set<string>>(new Set());

    const isUnlocked = selectedScopes.size > 0 && selectedProjects.size > 0;

    // Toggle helpers
    const toggle = useCallback((set: Set<string>, id: string, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
        setter(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleScope = useCallback((scopeId: string) => {
        setSelectedScopes(prev => {
            const next = new Set(prev);
            if (next.has(scopeId)) {
                next.delete(scopeId);
                setSelectedProjects(p => {
                    const pNext = new Set(p);
                    for (const pid of p) {
                        if (pid.startsWith(scopeId + '::')) pNext.delete(pid);
                    }
                    return pNext;
                });
            } else {
                next.add(scopeId);
                // Auto expand projects when scope is selected
                setCollapsed(v => ({ ...v, projects: false }));
            }
            return next;
        });
    }, []);

    // Filtered projects
    const filteredProjects = useMemo(() => {
        const q = normalize(projectSearch);
        return SCOPE_PROJECTS
            .filter(p => selectedScopes.has(p.scope))
            .filter(p => !q || normalize(p.name).includes(q) || normalize(p.scope).includes(q))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [selectedScopes, projectSearch]);

    // Filtered ecosystems
    const filteredEcos = useMemo(() => {
        const q = normalize(ecoSearch);
        return ECO_DATA
            .filter(e => e.env.some(env => activeEnvs.has(env)))
            .filter(e => !q || normalize([e.pt, e.en, e.desc, e.cat].join(' ')).includes(q));
    }, [activeEnvs, ecoSearch]);

    // Filtered params
    const filteredParams = useMemo(() => {
        const q = normalize(paramSearch);
        const result: Record<string, string[]> = {};
        for (const [cat, items] of Object.entries(PARAM_DATA)) {
            const filtered = items.filter(
                item => !q || normalize(cat + ' ' + item).includes(q)
            );
            if (filtered.length > 0) result[cat] = filtered;
        }
        return result;
    }, [paramSearch]);

    // Summary chips
    const summaryChips = useMemo(() => {
        const chips: { label: string; kind: string; onRemove: () => void }[] = [];
        for (const s of selectedScopes) {
            const meta = SCOPE_META.find(m => m.id === s);
            chips.push({ label: meta?.label || s, kind: 'scope', onRemove: () => toggleScope(s), });
        }
        for (const pid of selectedProjects) {
            const parts = pid.split('::');
            chips.push({ label: parts[1] || pid, kind: 'project', onRemove: () => toggle(selectedProjects, pid, setSelectedProjects), });
        }
        for (const m of selectedMatrices) {
            const meta = MATRIX_META.find(x => x.id === m);
            chips.push({ label: meta?.label || m, kind: 'matrix', onRemove: () => toggle(selectedMatrices, m, setSelectedMatrices), });
        }
        for (const b of selectedBiota) {
            const meta = BIOTA_META.find(x => x.id === b);
            chips.push({ label: meta?.label || b, kind: 'biota', onRemove: () => toggle(selectedBiota, b, setSelectedBiota), });
        }
        for (const p of selectedParams) {
            chips.push({ label: p.split('::')[1] || p, kind: 'param', onRemove: () => toggle(selectedParams, p, setSelectedParams), });
        }
        return chips;
    }, [selectedScopes, selectedProjects, selectedMatrices, selectedBiota, selectedParams, toggle, toggleScope]);

    const clearAll = () => {
        setSelectedScopes(new Set(['dados_publicos']));
        setSelectedProjects(new Set());
        setProjectSearch('');
        setCountry('');
        setState('');
        setCity('');
        setDateStart('');
        setDateEnd('');
        setActiveEnvs(new Set());
        setSelectedEcos(new Set());
        setEcoSearch('');
        setSelectedMatrices(new Set());
        setSelectedBiota(new Set());
        setParamSearch('');
        setSelectedParams(new Set());
        setOpenParamCats(new Set());
        setCollapsed({ params: true, projects: true, eco: true, region: true, period: true, env: true });
    };

    const handleApply = () => {
        const payload = {
            scopes: [...selectedScopes],
            projects: [...selectedProjects].map(pid => {
                const [scope, name] = pid.split('::');
                return { scope, name };
            }),
            region: { country, state, city },
            date_range: { start: dateStart, end: dateEnd },
            envs: [...activeEnvs],
            ecosystems: [...selectedEcos],
            matrices: [...selectedMatrices],
            biota: [...selectedBiota],
            parameters: [...selectedParams].map(pid => {
                const [cat, name] = pid.split('::');
                return { category: cat, name };
            }),
        };
        console.log('🔍 Envibase filter payload:', payload);
        window.dispatchEvent(new CustomEvent('envibase-filter-apply', { detail: payload }));
    };

    const toggleAllProjects = () => {
        const allKeys = filteredProjects.map(p => `${p.scope}::${p.name}`);
        const areAllSelected = allKeys.length > 0 && allKeys.every(k => selectedProjects.has(k));
        setSelectedProjects(prev => {
            const next = new Set(prev);
            if (areAllSelected) { allKeys.forEach(k => next.delete(k)); } 
            else { allKeys.forEach(k => next.add(k)); }
            return next;
        });
    };

    const toggleAllParams = () => {
        const allKeys: string[] = [];
        Object.entries(filteredParams).forEach(([cat, items]) => {
            items.forEach(item => allKeys.push(`${cat}::${item}`));
        });
        const areAllSelected = allKeys.length > 0 && allKeys.every(k => selectedParams.has(k));
        setSelectedParams(prev => {
            const next = new Set(prev);
            if (areAllSelected) { allKeys.forEach(k => next.delete(k)); } 
            else { allKeys.forEach(k => next.add(k)); }
            return next;
        });
    };

    const toggleAllScopes = () => {
        const allKeys = SCOPE_META.map(s => s.id);
        const areAllSelected = allKeys.every(k => selectedScopes.has(k));
        setSelectedScopes(prev => {
            const next = new Set(prev);
            if (areAllSelected) { allKeys.forEach(k => next.delete(k)); } 
            else { allKeys.forEach(k => next.add(k)); }
            return next;
        });
    };

    const toggleAllMatrices = () => {
        const allKeys = MATRIX_META.map(m => m.id);
        const areAllSelected = allKeys.every(k => selectedMatrices.has(k));
        setSelectedMatrices(prev => {
            const next = new Set(prev);
            if (areAllSelected) { 
                allKeys.forEach(k => next.delete(k)); 
                setSelectedBiota(new Set());
            } else { 
                allKeys.forEach(k => next.add(k)); 
            }
            return next;
        });
    };

    const toggleAllBiota = () => {
        const allKeys = BIOTA_META.map(b => b.id);
        const areAllSelected = allKeys.every(k => selectedBiota.has(k));
        setSelectedBiota(prev => {
            const next = new Set(prev);
            if (areAllSelected) { allKeys.forEach(k => next.delete(k)); } 
            else { allKeys.forEach(k => next.add(k)); }
            return next;
        });
    };

    const toggleAllEnvs = () => {
        const allKeys = ENV_META.map(e => e.id);
        const areAllSelected = allKeys.every(k => activeEnvs.has(k));
        setActiveEnvs(prev => {
            const next = new Set(prev);
            if (areAllSelected) { allKeys.forEach(k => next.delete(k)); } 
            else { allKeys.forEach(k => next.add(k)); }
            return next;
        });
    };

    const toggleAllEcos = () => {
        const allKeys = filteredEcos.map(eco => `${eco.cat}::${eco.pt}`);
        const areAllSelected = allKeys.length > 0 && allKeys.every(k => selectedEcos.has(k));
        setSelectedEcos(prev => {
            const next = new Set(prev);
            if (areAllSelected) { allKeys.forEach(k => next.delete(k)); } 
            else { allKeys.forEach(k => next.add(k)); }
            return next;
        });
    };

    // ── Shared styles ───────────────────────────────────────────
    const chipBase = "px-2 rounded-md transition-all font-semibold uppercase tracking-wider";
    const chipOn = "bg-primary text-primary-foreground border border-primary shadow-[0_2px_8px_rgba(46,91,255,0.3)]";
    const chipOff = "border border-black/10 dark:border-white/10 text-foreground/50 hover:border-primary/40 hover:bg-black/5 dark:hover:bg-white/5 focus:outline-none";
    const inputBase = "w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg py-1.5 px-3 text-xs text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-sans";
    const sectionLabel = "text-[11px] font-display uppercase tracking-widest font-bold text-primary/80 flex items-center gap-2 w-full text-left py-1 hover:text-primary transition-colors";

    const CollapsibleSection = ({ id, label, children, isMain = true }: { id: string, label: string, children: React.ReactNode, isMain?: boolean }) => (
        <section className="bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-[14px] p-2.5 border border-black/5 dark:border-white/10 overflow-hidden shadow-sm">
            <button onClick={() => toggleSection(id)} className={sectionLabel}>
                <div className="flex items-center gap-2 flex-1">
                    {isMain && <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_6px_rgba(46,91,255,0.6)]" />}
                    <span>{label}</span>
                </div>
                <motion.div
                    animate={{ rotate: collapsed[id] ? 0 : 180 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {!collapsed[id] && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                    >
                        <div className="mt-1 space-y-1.5">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );

    return (
        <div className="flex flex-col h-full text-foreground font-sans">
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">

                {/* 1. ESCOPO — 4 cards fixos, sempre visíveis */}
                <section className="bg-black/5 dark:bg-white/5 backdrop-blur-sm rounded-[14px] p-2.5 border border-black/5 dark:border-white/10 shadow-sm">
                    <div className="flex justify-between items-center mb-1.5">
                        <p className="text-[11px] font-display uppercase tracking-widest font-bold text-primary/80 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_6px_rgba(46,91,255,0.6)]" />
                            Escopo
                        </p>
                        <button onClick={toggleAllScopes} className="text-[9px] text-primary hover:underline font-bold">
                            Selecionar todos
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                        {SCOPE_META.map(s => {
                            const isOn = selectedScopes.has(s.id);
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => toggleScope(s.id)}
                                    className={`p-2 rounded-xl border text-left flex flex-col gap-1 transition-all duration-200 ${isOn
                                            ? 'border-primary/40 dark:border-primary/50 bg-primary/10 ring-1 ring-primary/20 shadow-[0_2px_8px_rgba(46,91,255,0.1)]'
                                            : 'border-black/10 dark:border-white/10 bg-white/50 dark:bg-transparent hover:bg-black/5 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <span className={`material-symbols-outlined text-base ${isOn ? 'text-primary' : 'text-foreground/40'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                                    <span className={`text-[10px] font-semibold ${isOn ? 'text-foreground font-bold' : 'text-foreground/70'}`}>{s.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* 2. PROJETOS ATIVOS */}
                <section className={`transition-all duration-300 ${!selectedScopes.size ? 'opacity-40 pointer-events-none' : ''}`}>
                    <CollapsibleSection id="projects" label="Projetos Ativos">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] text-foreground/40 font-semibold uppercase">Resultados ({filteredProjects.length})</span>
                            <button onClick={toggleAllProjects} className="text-[9px] text-primary hover:underline font-bold">
                                Selecionar todos
                            </button>
                        </div>
                        <div className="relative mb-2">
                            <Search className="absolute left-2.5 top-2.5 w-3 h-3 text-foreground/40" />
                            <input type="text" value={projectSearch} onChange={e => setProjectSearch(e.target.value)} placeholder="Buscar projeto..." className={`${inputBase} pl-8 h-8 text-[11px]`} />
                        </div>
                        <div className="max-h-[140px] overflow-y-auto rounded-lg border border-black/5 dark:border-white/10 bg-white/50 dark:bg-black/20 custom-scrollbar">
                            {filteredProjects.length === 0 ? <div className="p-3 text-[10px] text-foreground/25 text-center">Nenhum projeto encontrado.</div> :
                            filteredProjects.map(p => {
                                const pid = `${p.scope}::${p.name}`;
                                const isSelected = selectedProjects.has(pid);
                                return (
                                    <div key={pid} onClick={() => toggle(selectedProjects, pid, setSelectedProjects)} className={`flex items-center justify-between px-2.5 py-1.5 cursor-pointer text-[11px] border-b border-black/5 dark:border-white/5 last:border-b-0 ${isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                                        <div className="flex items-center gap-2 truncate flex-1">
                                            <div className={`w-3 h-3 rounded-[3px] border flex-shrink-0 flex items-center justify-center text-[7px] ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-foreground/30'}`}>{isSelected && '✓'}</div>
                                            <span className="truncate text-foreground/80">{p.name}</span>
                                        </div>
                                        <span className="text-[9px] text-foreground/35 font-mono ml-2">{p.updated}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CollapsibleSection>
                </section>

                {/* 3. MATRIZ E PARÂMETROS */}
                <section className={`transition-all duration-300 ${!selectedScopes.size ? 'opacity-40 pointer-events-none' : ''}`}>
                    <CollapsibleSection id="params" label="Matriz e Parâmetros">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] text-foreground/40 font-semibold uppercase">Matriz</span>
                            <button onClick={toggleAllMatrices} className="text-[9px] text-primary hover:underline font-bold">Selecionar todos</button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {MATRIX_META.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => {
                                        setSelectedMatrices(prev => {
                                            const next = new Set(prev);
                                            if (next.has(m.id)) { next.delete(m.id); if (m.id === 'biota') setSelectedBiota(new Set()); }
                                            else next.add(m.id);
                                            return next;
                                        });
                                    }}
                                    className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all border ${selectedMatrices.has(m.id) ? 'border-primary bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(46,91,255,0.3)]' : 'border-black/10 dark:border-white/10 text-foreground/50 hover:border-primary/40 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                        {selectedMatrices.has('biota') && (
                            <div className="pl-2 border-l-2 border-primary/30 mb-1 mt-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] text-foreground/40 font-semibold uppercase">Biota</span>
                                    <button onClick={toggleAllBiota} className="text-[9px] text-primary hover:underline font-bold">Selecionar todos</button>
                                </div>
                                <div className="flex flex-wrap gap-1 mb-1">
                                {BIOTA_META.map(b => (
                                    <button key={b.id} onClick={() => toggle(selectedBiota, b.id, setSelectedBiota)} className={`${chipBase} text-[9px] py-0.5 ${selectedBiota.has(b.id) ? chipOn : chipOff}`}>{b.label}</button>
                                ))}
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between items-center mb-1 mt-1">
                            <span className="text-[9px] text-foreground/40 font-semibold uppercase">Analitos</span>
                            <button onClick={toggleAllParams} className="text-[9px] text-primary hover:underline font-bold">
                                Selecionar todos
                            </button>
                        </div>
                        <div className="relative mb-2">
                            <Search className="absolute left-2.5 top-2.5 w-3 h-3 text-foreground/40" />
                            <input value={paramSearch} onChange={e => setParamSearch(e.target.value)} placeholder="Filtrar analitos..." className={`${inputBase} pl-8 h-8 text-[11px]`} />
                        </div>
                        <div className="rounded-lg border border-black/5 dark:border-white/10 bg-white/50 dark:bg-black/20 max-h-[150px] overflow-y-auto custom-scrollbar">
                            {Object.entries(filteredParams).map(([cat, items]) => {
                                const isOpen = openParamCats.has(cat);
                                return (
                                    <div key={cat}>
                                        <button onClick={() => toggle(openParamCats, cat, setOpenParamCats)} className="flex items-center justify-between w-full px-2.5 py-1.5 text-[10px] font-semibold text-foreground/80 hover:bg-black/5 dark:hover:bg-white/5 border-b border-black/5 dark:border-white/5 transition-colors">
                                            <div className="flex items-center gap-2">
                                                {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                <span className="material-symbols-outlined text-primary/60 text-base" style={{ fontVariationSettings: "'FILL' 0" }}>{isOpen ? 'folder_open' : 'folder'}</span>
                                                {cat}
                                            </div>
                                            <span className="text-[9px] text-foreground/30">{items.length}</span>
                                        </button>
                                        {isOpen && (
                                            <div className="pl-6 border-l border-border/20 ml-3.5 space-y-0.5 py-1">
                                                {items.map(item => {
                                                    const pid = `${cat}::${item}`;
                                                    const isSelected = selectedParams.has(pid);
                                                    return (
                                                        <div key={pid} onClick={() => toggle(selectedParams, pid, setSelectedParams)} className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer text-[10px] mb-0.5 ${isSelected ? 'bg-primary/10 text-foreground font-medium' : 'text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                                                            <span>{item}</span>
                                                            <div className={`w-3 h-3 rounded-[3px] border flex-shrink-0 flex items-center justify-center text-[7px] ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-foreground/30'}`}>{isSelected && '✓'}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CollapsibleSection>
                </section>

                {/* 4. AMBIENTE E ECOSSISTEMA */}
                <section className={`transition-all duration-300 ${!isUnlocked ? 'opacity-40 pointer-events-none' : ''}`}>
                    <CollapsibleSection id="env_eco" label="Ambiente e Ecossistema">
                        {/* Ambiente */}
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Ambiente</p>
                            <button onClick={toggleAllEnvs} className="text-[9px] text-primary hover:underline font-bold">Selecionar todos</button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                             {ENV_META.map(env => (
                                <button key={env.id} onClick={() => {
                                    toggle(activeEnvs, env.id, setActiveEnvs);
                                }} className={`${chipBase} py-0.5 text-[9px] ${activeEnvs.has(env.id) ? chipOn : chipOff}`}>{env.label}</button>
                            ))}
                        </div>

                        {/* Ecossistema */}
                        <div className="flex justify-between items-center mb-1 mt-0">
                            <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Ecossistema</p>
                            <button onClick={toggleAllEcos} className="text-[9px] text-primary hover:underline font-bold">Selecionar todos</button>
                        </div>
                        {!activeEnvs.size ? <p className="text-[10px] text-foreground/40 italic">Selecione um ambiente primeiro.</p> : (
                            <>
                                <div className="relative mb-2 mt-2">
                                    <Search className="absolute left-2.5 top-2.5 w-3 h-3 text-foreground/40" />
                                    <input value={ecoSearch} onChange={e => setEcoSearch(e.target.value)} placeholder="Buscar ecossistema..." className={`${inputBase} pl-8 h-8 text-[11px]`} />
                                </div>
                                <div className="max-h-[140px] overflow-y-auto rounded-lg border border-black/5 dark:border-white/10 bg-white/50 dark:bg-black/20 custom-scrollbar">
                                    {filteredEcos.length === 0 ? <div className="p-2 text-[10px] text-foreground/40 text-center">Nada encontrado.</div> :
                                    filteredEcos.map(eco => {
                                        const eid = `${eco.cat}::${eco.pt}`;
                                        const isSelected = selectedEcos.has(eid);
                                        return (
                                            <div key={eid} onClick={() => toggle(selectedEcos, eid, setSelectedEcos)} className={`flex items-center gap-2 px-2.5 py-1.5 cursor-pointer border-b border-black/5 dark:border-white/5 last:border-b-0 text-[11px] ${isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                                                <div className={`w-3 h-3 rounded-[3px] border flex-shrink-0 flex items-center justify-center text-[7px] ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-foreground/30'}`}>{isSelected && '✓'}</div>
                                                <span className="text-foreground/80 font-medium">{eco.pt}</span>
                                                <span className="text-[9px] text-foreground/40 ml-auto">{eco.cat}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </CollapsibleSection>
                </section>

                {/* 6. LOCALIDADE */}
                <section className={`transition-all duration-300 ${!isUnlocked ? 'opacity-40 pointer-events-none' : ''}`}>
                    <CollapsibleSection id="region" label="Localidade">
                        <div className="space-y-2">
                            <input value={country} onChange={e => setCountry(e.target.value)} placeholder="País" className={`${inputBase} h-8 text-[11px]`} />
                            <input value={state} onChange={e => setState(e.target.value)} placeholder="Estado" className={`${inputBase} h-8 text-[11px]`} />
                            <input value={city} onChange={e => setCity(e.target.value)} placeholder="Cidade" className={`${inputBase} h-8 text-[11px]`} />
                        </div>
                    </CollapsibleSection>
                </section>

                {/* 7. PERÍODO */}
                <section className={`transition-all duration-300 ${!isUnlocked ? 'opacity-40 pointer-events-none' : ''}`}>
                    <CollapsibleSection id="period" label="Período">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-foreground/40 uppercase ml-0.5">Início</label>
                                <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className={`${inputBase} h-8 text-[10px] px-2`} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-foreground/40 uppercase ml-0.5">Fim</label>
                                <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className={`${inputBase} h-8 text-[10px] px-2`} />
                            </div>
                        </div>
                    </CollapsibleSection>
                </section>

                {/* SUMMARY CHIPS */}
                {summaryChips.length > 0 && (
                    <section className="bg-primary/5 rounded-[14px] p-2 border border-dashed border-primary/30 mt-2 shadow-sm">
                        <h3 className="text-[9px] font-bold uppercase text-primary mb-2 tracking-widest pl-1">Filtros Ativos</h3>
                        <div className="flex flex-wrap gap-1.5">
                            {summaryChips.map((chip, i) => (
                                <span key={i} className="bg-white/90 dark:bg-black/40 text-foreground/90 font-medium border border-primary/20 px-2 py-0.5 rounded-md text-[10px] flex items-center gap-2 shadow-sm backdrop-blur-sm">
                                    {chip.label}
                                    <button onClick={chip.onRemove} className="text-foreground/40 hover:text-destructive font-bold transition-colors">×</button>
                                </span>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* ──── FOOTER ──── */}
            <div className="flex gap-2 pt-2.5 mt-1 border-t border-border/30">
                <button onClick={clearAll} className="flex-1 py-1.5 rounded-lg border border-border/40 text-foreground/60 text-[10px] font-bold uppercase hover:bg-foreground/5 transition-all">Limpar</button>
                <button onClick={handleApply} disabled={!isUnlocked} className={`flex-[2] py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${isUnlocked ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_4px_12px_rgba(46,91,255,0.25)] translate-y-0 active:translate-y-0.5' : 'bg-muted text-foreground/30 cursor-not-allowed'}`}>Aplicar Filtros</button>
            </div>
        </div>
    );
}
