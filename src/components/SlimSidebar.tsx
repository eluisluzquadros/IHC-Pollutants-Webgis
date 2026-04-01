import React from 'react';
import {
    BarChart3,
    Search,
    Upload,
    MessageSquare,
    Settings,
    HelpCircle,
    Database,
    FolderOpen,
    PieChart,
    Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SlimSidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    className?: string;
}

const navItems = [
    { id: 'filters',    icon: Search,        label: 'Filtros'      },
    { id: 'layers',     icon: Layers,        label: 'Camadas'      },
    { id: 'statistics', icon: BarChart3,      label: 'Estatísticas' },
    { id: 'dashboard',  icon: PieChart,       label: 'Dashboard'    },
    { id: 'data',       icon: Upload,         label: 'Dados'        },
    { id: 'projects',   icon: FolderOpen,     label: 'Projetos'     },
    { id: 'discovery',  icon: Database,       label: 'Discovery'    },
    { id: 'ai',         icon: MessageSquare,  label: 'AI Assistant' },
];

const bottomItems = [
    { id: 'settings', icon: Settings,    label: 'Configurações' },
    { id: 'help',     icon: HelpCircle,  label: 'Ajuda'         },
];

const SlimSidebar: React.FC<SlimSidebarProps> = ({ activeTab, onTabChange, className }) => {
    return (
        <TooltipProvider delayDuration={0}>
            <aside className={cn(
                "w-[60px] h-full flex flex-col items-center py-4 z-50 shrink-0 transition-colors duration-300",
                "bg-white dark:bg-[#0A192F] border-r border-slate-200 dark:border-[#1E2D4A]",
                className
            )}>

                {/* ── Logo ───────────────────────────────────────── */}
                <div
                    className="mb-5 cursor-pointer group"
                    onClick={() => (window.location.href = '/')}
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className={cn(
                                "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300",
                                "bg-[#2E5BFF] shadow-[0_4px_18px_rgba(46,91,255,0.45)]",
                                "group-hover:shadow-[0_6px_24px_rgba(46,91,255,0.65)] group-hover:scale-105"
                            )}>
                                <span
                                    className="material-symbols-outlined text-white text-[18px] select-none"
                                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 18" }}
                                >
                                    eco
                                </span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent
                            side="right"
                            className="bg-[#12213A] border-[#2E5BFF]/30 text-white font-medium text-xs"
                        >
                            Envibase — Início
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* ── Primary Navigation ─────────────────────────── */}
                <nav className="flex-1 flex flex-col gap-1 w-full px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <Tooltip key={item.id}>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => onTabChange(item.id)}
                                        className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center mx-auto",
                                            "transition-all duration-200 relative",
                                            isActive
                                                ? [
                                                    "bg-primary/10 dark:bg-[#2E5BFF]/20 text-primary dark:text-[#2E5BFF]",
                                                    "border border-primary/20 dark:border-[#2E5BFF]/35",
                                                    "shadow-[0_2px_12px_rgba(46,91,255,0.15)] dark:shadow-[0_2px_12px_rgba(46,91,255,0.25)]",
                                                  ]
                                                : [
                                                    "text-slate-400 dark:text-white/40",
                                                    "hover:text-slate-700 dark:hover:text-white/80 hover:bg-slate-100 dark:hover:bg-white/6",
                                                  ]
                                        )}
                                        aria-label={item.label}
                                    >
                                        <Icon className={cn(
                                            "w-[18px] h-[18px]",
                                            isActive ? "stroke-[2px]" : "stroke-[1.5px]"
                                        )} />

                                        {/* Active indicator */}
                                        {isActive && (
                                            <span className={cn(
                                                "absolute left-[-9px] top-1/2 -translate-y-1/2",
                                                "w-[3px] h-5 rounded-r-full",
                                                "bg-[#00E676]",
                                                "shadow-[0_0_10px_rgba(0,230,118,0.7)]"
                                            )} />
                                        )}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="right"
                                    className="bg-[#12213A] border-[#1E2D4A] text-white font-medium text-xs shadow-xl"
                                >
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </nav>

                {/* ── Divider ────────────────────────────────────── */}
                <div className="w-6 h-px bg-slate-200 dark:bg-[#1E2D4A] my-2 transition-colors duration-300" />

                {/* ── Bottom Actions ─────────────────────────────── */}
                <div className="flex flex-col gap-1 w-full px-2">
                    {bottomItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <Tooltip key={item.id}>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => onTabChange(item.id)}
                                        className={cn(
                                            "w-9 h-9 rounded-xl flex items-center justify-center mx-auto",
                                            "transition-all duration-200 relative",
                                            isActive
                                                ? "bg-primary/10 dark:bg-[#2E5BFF]/20 text-primary dark:text-[#2E5BFF] border border-primary/20 dark:border-[#2E5BFF]/35"
                                                : "text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/70 hover:bg-slate-100 dark:hover:bg-white/6"
                                        )}
                                        aria-label={item.label}
                                    >
                                        <Icon className="w-[17px] h-[17px] stroke-[1.5px]" />
                                        {isActive && (
                                            <span className="absolute left-[-9px] top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#00E676] shadow-[0_0_10px_rgba(0,230,118,0.7)]" />
                                        )}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="right"
                                    className="bg-[#12213A] border-[#1E2D4A] text-white font-medium text-xs shadow-xl"
                                >
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>
            </aside>
        </TooltipProvider>
    );
};

export default SlimSidebar;
