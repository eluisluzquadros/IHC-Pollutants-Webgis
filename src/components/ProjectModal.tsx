import React, { useState, useEffect } from 'react';
import { X, Lock, Globe, MapPin, BookOpen, Save } from 'lucide-react';

const STUDY_TYPES = ['Monitoramento Ambiental','EIA','RIMA','Pesquisa Cientifica','Consultoria','Licenciamento','Outro'];
const DEFAULT_FORM = { name: '', description: '', visibility: 'private' as const, studyType: STUDY_TYPES[0], location: { country: 'Brasil', state: '', city: '' } };

interface ProjectFormData { name: string; description: string; visibility: 'private'|'public'; studyType: string; location: { country: string; state: string; city: string } }
interface ProjectModalProps { open: boolean; onClose: () => void; onSave: (d: ProjectFormData) => Promise<void>; initial?: any }

export const ProjectModal: React.FC<ProjectModalProps> = ({ open, onClose, onSave, initial }) => {
  const [form, setForm] = useState<ProjectFormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);
  useEffect(() => {
    if (open) {
      setForm(initial ? { name: initial.name??'', description: initial.description??'', visibility: initial.visibility??'private', studyType: initial.studyType??STUDY_TYPES[0], location: initial.location??{country:'Brasil',state:'',city:''} } : DEFAULT_FORM);
      setError(null);
    }
  }, [open, initial]);
  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nome e obrigatorio'); return; }
    setSaving(true);
    try { await onSave(form); onClose(); } catch(e){ setError(String(e)); } finally { setSaving(false); }
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-foreground font-bold text-lg">{initial?.id ? 'Editar Projeto' : 'Novo Projeto'}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">{error}</div>}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome *</label>
            <input className="bg-background border border-border text-foreground rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary/60 placeholder:text-muted-foreground" placeholder="Nome do projeto" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descricao</label>
            <textarea rows={3} className="bg-background border border-border text-foreground rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary/60 placeholder:text-muted-foreground resize-none" placeholder="Objetivos e escopo" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visibilidade</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={()=>setForm(f=>({...f,visibility:'private'}))} className={'flex items-center gap-3 p-3 rounded-xl border transition-all text-sm font-medium '+(form.visibility==='private'?'bg-primary/10 border-primary/50 text-primary':'bg-background border-border text-muted-foreground')}><Lock size={16}/>Privado</button>
              <button onClick={()=>setForm(f=>({...f,visibility:'public'}))} className={'flex items-center gap-3 p-3 rounded-xl border transition-all text-sm font-medium '+(form.visibility==='public'?'bg-primary/10 border-primary/50 text-primary':'bg-background border-border text-muted-foreground')}><Globe size={16}/>Publico</button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><BookOpen size={12}/>Tipo de Estudo</label>
            <select className="bg-background border border-border text-foreground rounded-lg px-4 py-2.5 text-sm outline-none" value={form.studyType} onChange={e=>setForm(f=>({...f,studyType:e.target.value}))}>
              {STUDY_TYPES.map(t=><option key={t} value={t} className="bg-background">{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><MapPin size={12}/>Localizacao</label>
            <div className="grid grid-cols-3 gap-2">
              {(['country','state','city'] as const).map(field=>(
                <input key={field} className="bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/60 placeholder:text-muted-foreground" placeholder={{country:'Pais',state:'Estado',city:'Cidade'}[field]} value={form.location[field]} onChange={e=>setForm(f=>({...f,location:{...f.location,[field]:e.target.value}}))} />
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-border flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"><Save size={14}/>{saving?'Salvando...':'Salvar'}</button>
        </div>
      </div>
    </div>
  );
};
export default ProjectModal;