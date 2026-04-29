import React, { useState, useEffect, useCallback } from 'react';
import { FolderOpen, Plus, Pencil, Trash2, CheckCircle2, Globe, Lock, Database, Calendar, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getProjects, saveProject, deleteProject, generateId, StoredProject } from '@/services/storageService';
import ProjectModal from './ProjectModal';

const ProjectManagerPanel: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StoredProject|undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<string|null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string|null>(null);
  const ownerId = user?.id ?? 'anonymous';

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const list = await getProjects(ownerId);
      list.sort((a,b) => b.createdAt - a.createdAt);
      setProjects(list);
    } catch { toast.error('Erro ao carregar projetos'); }
    finally { setLoading(false); }
  }, [ownerId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const stored = sessionStorage.getItem('activeProjectId');
    if (stored) setActiveProjectId(stored);
  }, []);

  const handleSave = async (data: any) => {
    const now = Date.now();
    const project: StoredProject = editing
      ? { ...editing, ...data, updatedAt: now }
      : { id: generateId('proj'), ownerId, createdAt: now, updatedAt: now, ...data };
    await saveProject(project);
    toast.success(editing ? 'Projeto atualizado' : 'Projeto criado!');
    await load();
    if (!editing) { setActiveProjectId(project.id); sessionStorage.setItem('activeProjectId', project.id); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id);
      if (activeProjectId === id) { setActiveProjectId(null); sessionStorage.removeItem('activeProjectId'); }
      toast.success('Projeto removido');
      setDeleteConfirm(null);
      await load();
    } catch { toast.error('Erro ao remover projeto'); }
  };

  const setActive = (id: string) => {
    setActiveProjectId(id);
    sessionStorage.setItem('activeProjectId', id);
    toast.success('Projeto ativo definido');
  };

  return (
    <div className="flex flex-col h-full text-foreground">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2"><FolderOpen size={16} className="text-primary" />Meus Projetos</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">{projects.length} projeto{projects.length!==1?'s':''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Atualizar"><RefreshCw size={14} /></button>
          <button onClick={()=>{setEditing(undefined);setModalOpen(true);}} className="flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors"><Plus size={14}/>Novo Projeto</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {loading && <div className="flex items-center justify-center py-12 text-muted-foreground text-sm"><RefreshCw size={16} className="animate-spin mr-2" />Carregando...</div>}
        {!loading && projects.length===0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <FolderOpen size={36} className="text-primary/40" />
            <div className="text-center">
              <p className="text-foreground font-semibold mb-1">Nenhum projeto ainda</p>
              <p className="text-muted-foreground text-sm">Crie seu primeiro projeto para organizar seus dados.</p>
            </div>
            <button onClick={()=>setModalOpen(true)} className="bg-primary text-primary-foreground text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-primary/90 flex items-center gap-2"><Plus size={15}/>Criar Primeiro Projeto</button>
          </div>
        )}
        {!loading && projects.map(p => (
          <div key={p.id} className={'bg-card rounded-xl border p-4 flex flex-col gap-3 transition-all '+(activeProjectId===p.id?'border-primary/50':'border-border hover:border-border/80')}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {activeProjectId===p.id && <CheckCircle2 size={13} className="text-primary shrink-0" />}
                  <span className="text-sm font-semibold text-foreground truncate">{p.name}</span>
                </div>
                {p.description && <p className="text-[11px] text-muted-foreground line-clamp-2">{p.description}</p>}
              </div>
              <span className={'shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full '+(p.visibility==='public'?'bg-blue-500/10 text-blue-400 border border-blue-500/20':'bg-white/5 text-gray-500 border border-white/10')}>
                {p.visibility==='public'?<Globe size={9}/>:<Lock size={9}/>}
                {p.visibility==='public'?'Publico':'Privado'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.studyType && <span className="text-[10px] bg-primary/10 text-primary/80 border border-primary/20 px-2 py-0.5 rounded-full">{p.studyType}</span>}
              {(p.location?.state||p.location?.city) && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Database size={9}/>{[p.location.city,p.location.state].filter(Boolean).join(', ')}</span>}
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto"><Calendar size={9}/>{new Date(p.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            {deleteConfirm===p.id ? (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center gap-3">
                <AlertTriangle size={14} className="text-destructive shrink-0" />
                <span className="text-xs text-destructive flex-1">Remover projeto e dados?</span>
                <button onClick={()=>handleDelete(p.id)} className="text-xs bg-destructive text-destructive-foreground px-3 py-1 rounded-lg font-bold hover:bg-destructive/90">Confirmar</button>
                <button onClick={()=>setDeleteConfirm(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
              </div>
            ) : (
              <div className="flex gap-2 pt-1 border-t border-border">
                {activeProjectId!==p.id && <button onClick={()=>setActive(p.id)} className="flex-1 text-xs text-primary/70 hover:text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 py-1.5 rounded-lg flex items-center justify-center gap-1.5"><CheckCircle2 size={12}/>Definir como ativo</button>}
                {activeProjectId===p.id && <div className="flex-1 text-xs text-primary bg-primary/10 border border-primary/30 py-1.5 rounded-lg flex items-center justify-center gap-1.5"><CheckCircle2 size={12}/>Projeto ativo</div>}
                <button onClick={()=>{setEditing(p);setModalOpen(true);}} className="p-2 text-muted-foreground hover:text-foreground bg-white/5 border border-white/10 rounded-lg" title="Editar"><Pencil size={13}/></button>
                <button onClick={()=>setDeleteConfirm(p.id)} className="p-2 text-muted-foreground hover:text-destructive bg-white/5 border border-white/10 hover:border-destructive/30 rounded-lg" title="Remover"><Trash2 size={13}/></button>
              </div>
            )}
          </div>
        ))}
      </div>
      <ProjectModal open={modalOpen} onClose={()=>setModalOpen(false)} onSave={handleSave} initial={editing} />
    </div>
  );
};
export default ProjectManagerPanel;