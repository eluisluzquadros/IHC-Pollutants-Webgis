import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronRight, Filter } from 'lucide-react';

/**
 * EnviBase Discovery Module
 * Based on Stitch Asset: envibase_catalog_&_metadata_explorer
 */

const EnvibaseDiscovery: React.FC = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
        atmospheric: true,
        oceanic: false,
        terrestrial: true,
        cryosphere: false
    });

    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
        category: false,
        provider: false,
        format: false
    });

    const toggleSection = (id: string) => {
        setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleConnectWallet = () => {
        toast.info("Connecting to wallet provided by Envibase...");
    };

    const CollapsibleSection = ({ id, label, children }: { id: string, label: string, children: React.ReactNode }) => (
        <div className="border-b border-border/30 pb-4">
            <button 
                onClick={() => toggleSection(id)}
                className="text-foreground text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-between w-full hover:text-primary transition-colors py-2"
            >
                <span className="flex items-center gap-2">
                    {label}
                </span>
                <motion.div
                    animate={{ rotate: collapsed[id] ? 0 : 180 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {!collapsed[id] && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-3 pt-1 pb-2">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-background text-foreground font-['Space_Grotesk',sans-serif] overflow-hidden">
            {/* Top Navigation Bar */}
            <header className="flex items-center justify-between border-b border-border px-6 py-3 bg-background shrink-0 z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 text-primary">
                        <div className="size-8">
                            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd" d="M47.2426 24L24 47.2426L0.757355 24L24 0.757355L47.2426 24ZM12.2426 21H35.7574L24 9.24264L12.2426 21Z" fill="currentColor" fillRule="evenodd"></path>
                            </svg>
                        </div>
                        <h2 className="text-foreground text-xl font-bold tracking-tight">Envibase Discovery</h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <a className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors cursor-pointer">Catalog</a>
                        <a className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors cursor-pointer">Collections</a>
                        <a className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors cursor-pointer">Providers</a>
                        <a className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors cursor-pointer">API Docs</a>
                    </nav>
                </div>
                <div className="flex flex-1 justify-end gap-4 max-w-2xl ml-8">
                    <div className="relative w-full max-w-md group hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4" />
                        <input
                            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary focus:border-primary placeholder:text-muted-foreground text-foreground outline-none transition-all"
                            placeholder="Search datasets, providers, or variables..."
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleConnectWallet}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                        Connect Wallet
                    </button>
                    <div className="w-10 h-10 rounded-full bg-card border border-border overflow-hidden">
                        <img
                            className="w-full h-full object-cover"
                            alt="User profile avatar"
                            src={"https://lh3.googleusercontent.com/aida-public/AB6AXuA8iUCtOswV0crkmt3GC0vBoQJNkg7BeFiTekA6PzRPrK7K2Mo_zsB34qkRudcSu9Tv-mexejHLtaH9FlZiCxLoq1ilN1P6zePp0ihdOiy6j3KeSlxCiffOQpoM8_Zea4f04WjLDrJnsHDQlN-cNo7T98lWz6QMUiKmeGlicF_by6xaP4as7_86tbHaRtHZYcEqnuWshHnmhqy7vNEBb2sQMI5CWaVcVSLuUzyWf1L36qLZkTGcOIpZFXzQ000l9656dLqZyJf8Vy4"}
                        />
                    </div>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden">
                {/* Sidebar Filters */}
                <aside className="w-72 border-r border-border flex flex-col bg-background/50 hidden lg:flex shrink-0">
                    <div className="p-6 border-b border-border">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-foreground font-bold text-lg flex items-center gap-2">
                                <Filter className="w-5 h-5 text-primary" />
                                Filters
                            </h3>
                            <button className="text-xs text-primary hover:underline" onClick={() => setActiveFilters({ atmospheric: false, oceanic: false, terrestrial: false, cryosphere: false })}>Clear</button>
                        </div>
                        <p className="text-muted-foreground text-xs">Narrow down 12,402 datasets</p>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2">
                        {/* Category Section */}
                        <CollapsibleSection id="category" label="Category">
                            {[
                                { id: 'atmospheric', label: 'Atmospheric' },
                                { id: 'oceanic', label: 'Oceanic' },
                                { id: 'terrestrial', label: 'Terrestrial' },
                                { id: 'cryosphere', label: 'Cryosphere' }
                            ].map((filter) => (
                                <label key={filter.id} className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={activeFilters[filter.id]}
                                        onChange={() => setActiveFilters(prev => ({ ...prev, [filter.id]: !prev[filter.id] }))}
                                        className="rounded border-border bg-card text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{filter.label}</span>
                                </label>
                            ))}
                        </CollapsibleSection>

                        {/* Provider Section */}
                        <CollapsibleSection id="provider" label="Provider">
                            {['NOAA', 'NASA', 'ESA', 'Copernicus', 'USGS'].map((provider) => (
                                <label key={provider} className="flex items-center gap-3 cursor-pointer group">
                                    <input className="rounded border-border bg-card text-primary focus:ring-primary" type="checkbox" />
                                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{provider}</span>
                                </label>
                            ))}
                        </CollapsibleSection>

                        {/* Data Format Section */}
                        <CollapsibleSection id="format" label="Data Format">
                            <div className="flex flex-wrap gap-2 pt-1">
                                {['ZARR', 'COG', 'PARQUET', 'NETCDF', 'GEOJSON'].map(fmt => (
                                    <span key={fmt} className="px-2 py-1 rounded bg-card border border-border text-[10px] text-muted-foreground hover:border-primary cursor-pointer transition-colors">
                                        {fmt}
                                    </span>
                                ))}
                            </div>
                        </CollapsibleSection>
                    </div>
                </aside>

                {/* Main Content Area */}
                <section className="flex-1 flex flex-col h-full bg-background">
                    {/* Hero / Title Section */}
                    <div className="p-8 border-b border-border bg-gradient-to-b from-card/20 to-transparent shrink-0">
                        <div className="flex flex-wrap items-end justify-between gap-6">
                            <div>
                                <nav className="flex items-center gap-2 text-muted-foreground text-xs mb-4">
                                    <a className="hover:text-primary transition-colors" href="#">Home</a>
                                    <ChevronRight className="w-3 h-3" />
                                    <span className="text-foreground/80">Explorer</span>
                                </nav>
                                <h1 className="text-foreground text-4xl font-black tracking-tight mb-2">Envibase Explorer</h1>
                                <p className="text-muted-foreground max-w-2xl leading-relaxed">
                                    A high-resolution gateway to planetary-scale environmental datasets. Access, preview, and process metadata-rich cloud-native formats.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex rounded-lg border border-border p-1 bg-card/50">
                                    <button className="p-1.5 bg-primary text-primary-foreground rounded shadow-sm">
                                        <span className="material-symbols-outlined text-[20px]">grid_view</span>
                                    </button>
                                    <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
                                    </button>
                                </div>
                                <button className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-lg text-sm font-medium hover:border-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">map</span>
                                    View on Global Map
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Dataset Grid */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-1">
                            {/* Dataset Cards would go here based on filters - mocking a few */}
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 flex flex-col cursor-pointer">
                                    <div className="relative h-44 bg-background overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent z-10" />
                                        <img
                                            className="w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700"
                                            alt="Dataset preview"
                                            src={`https://picsum.photos/seed/${i + 100}/600/400`}
                                        />
                                        <div className="absolute top-3 left-3 flex gap-2 z-20">
                                            <span className="bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded">COG</span>
                                            <span className="bg-background/80 text-foreground text-[10px] px-2 py-0.5 rounded border border-border">1.2 TB</span>
                                        </div>
                                    </div>
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-foreground font-bold text-lg group-hover:text-primary transition-colors leading-tight">Global Environmental Layer {i}</h3>
                                            <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary text-[20px]">arrow_outward</span>
                                        </div>
                                        <p className="text-muted-foreground text-sm line-clamp-2 mb-6">High-resolution planetary dataset providing critical insights into environmental changes and ecosystem health.</p>
                                        <div className="mt-auto pt-4 border-t border-border grid grid-cols-2 gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Update</span>
                                                <span className="text-xs text-foreground/80">2 days ago</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Rating</span>
                                                <span className="text-xs text-primary">★★★★★</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default EnvibaseDiscovery;
