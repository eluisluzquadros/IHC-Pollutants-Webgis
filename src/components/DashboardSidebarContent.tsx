import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Folder, Send, MessageSquare } from 'lucide-react';

interface TreeItemProps {
    label: string;
    children?: React.ReactNode;
    isOpen?: boolean;
}

const TreeItem: React.FC<TreeItemProps> = ({ label, children, isOpen = false }) => {
    const [open, setOpen] = useState(isOpen);
    return (
        <div className="ml-1">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 w-full text-left py-1.5 text-white/50 hover:text-white transition-colors text-xs group"
            >
                <span className="text-white/30 group-hover:text-[#13ec80] transition-colors">
                    {children ? (open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />) : <div className="w-3 h-3" />}
                </span>
                <Folder className="w-3 h-3 text-[#13ec80]/40 group-hover:text-[#13ec80]/80 transition-colors" />
                <span>{label}</span>
            </button>
            {open && <div className="ml-2 pl-2 border-l border-[#234836]/30 space-y-1 mt-1">{children}</div>}
        </div>
    );
};

const DashboardSidebarContent: React.FC = () => {
    const [chatInput, setChatInput] = useState('');

    return (
        <div className="flex flex-col h-full bg-[#102219] text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {/* Header — eco logo + título (Stitch spec) */}
            <div className="p-4 space-y-4 border-b border-[#234836]/30">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-[#13ec80] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(19,236,128,0.25)] flex-shrink-0">
                        <span
                            className="material-symbols-outlined text-[#0a110d] text-[18px] select-none"
                            style={{ fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 18" }}
                        >
                            eco
                        </span>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold leading-none text-white">Envibase Discovery</h1>
                        <span className="text-[10px] bg-[#13ec80]/8 text-[#13ec80]/60 border border-[#13ec80]/15 px-1.5 py-0.5 rounded mt-1 inline-block">MVP v2.0</span>
                    </div>
                </div>

                {/* Global Search */}
                <div className="relative group">
                    <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-white/30 group-focus-within:text-[#13ec80] transition-colors" />
                    <input
                        type="text"
                        placeholder="Pesquisar envibases..."
                        className="w-full bg-[#1a2e24]/60 border border-[#234836]/40 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-[#13ec80]/40 focus:ring-1 focus:ring-[#13ec80]/20 transition-all"
                    />
                </div>
            </div>

            {/* Filtros em Árvore (Discovery Engine) */}
            <div className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar">
                <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold text-[#13ec80]/70 uppercase tracking-widest">Filtros em Árvore</p>
                    <button className="text-[10px] text-white/30 hover:text-white/70 transition-colors">Expandir</button>
                </div>

                <nav className="space-y-1">
                    <TreeItem label="Categoria" isOpen>
                        <TreeItem label="Uso do Solo" />
                        <TreeItem label="Hidrografia" />
                        <TreeItem label="Clima & Atmosfera" />
                        <TreeItem label="Biodiversidade" />
                        <TreeItem label="Região" isOpen>
                            <TreeItem label="Amazônia" isOpen>
                                <TreeItem label="Parâmetro" isOpen>
                                    <TreeItem label="Desmatamento" isOpen>
                                        {/* Envibase Result Card — Stitch spec */}
                                        <div className="mt-2 mb-2 p-3 bg-[#13ec80]/5 border border-[#13ec80]/20 rounded-lg group hover:border-[#13ec80]/40 hover:bg-[#13ec80]/8 transition-all cursor-pointer">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-xs font-semibold text-white/90 group-hover:text-[#13ec80] transition-colors">MapBiomas LULC</h4>
                                                <span className="text-[9px] bg-[#13ec80] text-[#0a110d] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Público</span>
                                            </div>
                                            <p className="text-[10px] text-white/40 leading-relaxed mb-2 line-clamp-2">Classificação de cobertura e uso da terra no bioma Amazônia com alta resolução.</p>
                                            <div className="flex gap-3 text-[9px] text-[#13ec80]/40 font-mono">
                                                <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-[#13ec80]/40"></div>MapBiomas</span>
                                                <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-[#13ec80]/40"></div>Out/2023</span>
                                            </div>
                                        </div>
                                    </TreeItem>
                                </TreeItem>
                            </TreeItem>
                            <TreeItem label="Cerrado" />
                            <TreeItem label="Mata Atlântica" />
                        </TreeItem>
                    </TreeItem>
                    <TreeItem label="Satélites">
                        <TreeItem label="Sentinel-2" />
                        <TreeItem label="Landsat 8" />
                        <TreeItem label="CBERS-4A" />
                    </TreeItem>
                </nav>
            </div>

            {/* Assistente AI Context — bottom panel */}
            <div className="p-4 border-t border-[#234836]/30 bg-[#0d1a12]">
                <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-3 h-3 text-[#13ec80]" />
                    <span className="text-[10px] font-bold text-[#13ec80] uppercase tracking-widest">Assistente AI Context</span>
                </div>
                <div className="relative">
                    <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Pergunte sobre os dados visíveis..."
                        className="w-full bg-[#1a2e24]/80 border border-[#234836]/40 rounded-lg py-2.5 pl-3 pr-9 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-[#13ec80]/30 transition-all"
                    />
                    <button className="absolute right-2 top-2 p-0.5 text-white/20 hover:text-[#13ec80] transition-colors">
                        <Send className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardSidebarContent;
