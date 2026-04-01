import React, { memo, useCallback, useMemo, useRef, useState, useEffect, Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Download, AlertCircle, CheckCircle, Loader2, MapPin, BarChart3, Settings, Filter, Bot, Calculator, Globe, ChevronRight, Search, Settings2, FolderOpen, PieChart, Layers, Sun, Moon } from "lucide-react";
import { importCSVFile, downloadCSV, StationData } from "@/utils/csvImporter";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import StationTooltip from "./StationTooltip";
import { MapCommandProvider } from "@/contexts/MapCommandContext";
import * as turf from '@turf/turf';

// Lazy load heavy components for better performance
const MapContainer = lazy(() => import("./MapContainer"));
const PollutionDashboard = lazy(() => import("./PollutionDashboard"));
const DataFilterPanel = lazy(() => import("./DataFilterPanel"));
const StatisticsPanel = lazy(() => import("./StatisticsPanel"));
const EnvibaseFilterPanel = lazy(() => import("./EnvibaseFilterPanel"));
const DataImportPanel = lazy(() => import("./DataImportPanel"));
const ProjectManagerPanel = lazy(() => import("./ProjectManagerPanel"));
import ChatBot from "./ChatBot";
import SlimSidebar from "./SlimSidebar";
import DashboardSidebarContent from "./DashboardSidebarContent";
import { LLMSettings } from "./LLMSettings";
import { useAuth, Project } from "@/contexts/AuthContext";
import { useDuckDB } from "@/contexts/DuckDBContext";
import { useDuckDBAnalytics } from "@/hooks/useDuckDBAnalytics";
import { Project as AuthProject } from "@/contexts/AuthContext";
import { getProjects, StoredProject, getDatasets } from '@/services/storageService';

/**
 * Professional WebGIS Application
 * 
 * A complete redesign of the WebGIS platform following modern design principles:
 * - Clean, professional layout with proper spacing and typography
 * - Optimized performance with lazy loading and memoization
 * - Comprehensive error handling and loading states
 * - Fully responsive design with mobile-first approach
 * - Accessibility compliant (WCAG 2.1 AA)
 * - Professional color scheme and design system
 */

interface StationFilters {
  stationQuery: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  polAMin?: number;
  polBMin?: number;
  visiblePollutants: string[];
}

interface MapSettings {
  showStations: boolean;
  showAdvancedMarkers: boolean;
  showHeatmap: boolean;
  heatmapOpacity: number;
  heatmapRadius: number;
  enableStationClustering: boolean;
  enableRecordClustering: boolean;
  showRecordCount: boolean;
}

interface TooltipState {
  station: {
    id: string;
    name: string;
    lat: number;
    lon: number;
    pol_a: number;
    pol_b: number;
    date?: string;
  };
  x: number;
  y: number;
}

const DEFAULT_FILTERS: StationFilters = {
  stationQuery: "",
  dateFrom: null,
  dateTo: null,
  polAMin: 0,
  polBMin: 0,
  visiblePollutants: ["pol_a", "pol_b"],
};

const DEFAULT_MAP_SETTINGS: MapSettings = {
  showStations: true,
  showAdvancedMarkers: false,
  showHeatmap: false,
  heatmapOpacity: 0.85,
  heatmapRadius: 25,
  enableStationClustering: false,
  enableRecordClustering: false,
  showRecordCount: false,
};

// Loading Component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-6 h-6 animate-spin text-primary mr-3" />
    <span className="text-sm text-foreground/50">{message}</span>
  </div>
);

// Professional Header Component
const ProfessionalHeader: React.FC<{
  stationCount: number;
  recordCount: number;
  activeProject: Project | null;
  user: { displayName?: string | null; email?: string | null; photoURL?: string | null } | null;
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}> = memo(({ stationCount, recordCount, activeProject, user, onMenuToggle, isMenuOpen }) => (
  <header className="bg-white dark:bg-background/95 border-b border-border/40 sticky top-0 z-30 transition-colors duration-300">
    <div className="px-4 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: mobile menu + project name */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="lg:hidden text-foreground/60 hover:text-primary transition-colors shrink-0"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            <div className="w-5 h-5 flex flex-col justify-center gap-1">
              <div className={`h-0.5 bg-current transition-all ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <div className={`h-0.5 bg-current transition-all ${isMenuOpen ? 'opacity-0' : ''}`} />
              <div className={`h-0.5 bg-current transition-all ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </Button>

          <div className="min-w-0">
            <h1 className="text-sm font-bold text-foreground leading-tight truncate">
              {activeProject?.name || "Envibase"}
            </h1>
            <p className="text-[9px] font-medium text-foreground/35 uppercase tracking-widest truncate">
              {activeProject?.description || "Inteligência Ambiental Estratégica"}
            </p>
          </div>
        </div>

        {/* Right: stats + live sync + user */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Data counters */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-center">
              <div className="text-xs font-bold text-primary leading-tight">{stationCount}</div>
              <div className="text-[9px] text-foreground/35 font-semibold uppercase tracking-wider">Stations</div>
            </div>
            <div className="w-px h-6 bg-border/40" />
            <div className="text-center">
              <div className="text-xs font-bold text-foreground leading-tight">{recordCount.toLocaleString()}</div>
              <div className="text-[9px] text-foreground/35 font-semibold uppercase tracking-wider">Records</div>
            </div>
            {recordCount > 0 && (
              <>
                <div className="w-px h-6 bg-border/40" />
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold text-primary/70 tracking-tight">LIVE</span>
                </div>
              </>
            )}
          </div>

          {/* User profile chip */}
          {user ? (
            <div className="flex items-center gap-2 pl-3 border-l border-border/40">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="avatar"
                  className="w-7 h-7 rounded-full border border-border/30 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-primary">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="hidden md:block">
                <div className="text-[11px] font-semibold text-foreground leading-tight">
                  {user.displayName || user.email?.split('@')[0] || 'Usuário'}
                </div>
                <div className="text-[9px] text-foreground/35 leading-tight">{user.email}</div>
              </div>
            </div>
          ) : (
            <div className="pl-3 border-l border-border/40">
              <div className="text-[10px] text-foreground/30 font-medium">Visitante</div>
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
));

// ProfessionalSidebar Component
const ProfessionalSidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showHeader?: boolean;
}> = memo(({ isOpen, onClose, children, showHeader = true }) => (
  <>
    {/* Mobile Overlay */}
    {isOpen && (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
    )}

    {/* Sidebar - Premium Light Mode & Glassmorphism */}
    <aside className={`
      fixed top-0 left-0 h-full w-[320px] bg-white/95 dark:bg-background/95 backdrop-blur-xl border-r border-border/50 shadow-2xl z-50
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0 lg:static lg:shadow-none
    `}>
      <div className="h-full flex flex-col">
        {/* Sidebar Header */}
        {showHeader && (
          <div className="p-6 border-b border-border/30">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black tracking-tighter flex items-center gap-1.5 text-foreground">
                Envibase <span className="text-primary">Platform</span>
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="lg:hidden text-foreground/40 hover:text-primary transition-colors"
                aria-label="Close sidebar"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar text-foreground p-2">
          {children}
        </div>
      </div>
    </aside>
  </>
));

// Main Application Component
const ProfessionalWebGISApp: React.FC = () => {
  const { user, projects, activeProject, setActiveProject, createProject, logout } = useAuth();
  const { createTable, db } = useDuckDB();

  // Core state management
  const [activeTab, setActiveTab] = useState<'map' | 'layers' | 'projects' | 'data' | 'discovery' | 'dashboard' | 'statistics' | 'filters' | 'settings' | 'ai'>('filters');
  const [isDarkMode, setIsDarkMode] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );
  const toggleDarkMode = useCallback(() => {
    const html = document.documentElement;
    if (isDarkMode) { html.classList.remove('dark'); } else { html.classList.add('dark'); }
    setIsDarkMode(d => !d);
  }, [isDarkMode]);
  const [stationData, setStationData] = useState<StationData[]>([]);
  const [filteredData, setFilteredData] = useState<StationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StationFilters>(DEFAULT_FILTERS);
  const [spatialFilterGeometry, setSpatialFilterGeometry] = useState<any>(null);

  // DuckDB Analytics with SQL Filtering
  const { analytics: duckAnalytics } = useDuckDBAnalytics('stations', activeTab === 'dashboard', filters);
  const [mapSettings, setMapSettings] = useState<MapSettings>(DEFAULT_MAP_SETTINGS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<TooltipState | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeLocalProjectId, setActiveLocalProjectId] = useState<string | null>(null);

  useEffect(() => {
    const checkActiveProject = () => {
      const storedId = sessionStorage.getItem('activeProjectId');
      if (storedId !== activeLocalProjectId) {
        setActiveLocalProjectId(storedId);
      }
    };
    checkActiveProject();
    const interval = setInterval(checkActiveProject, 1000);
    return () => clearInterval(interval);
  }, [activeLocalProjectId]);

  // Memoized calculations for performance
  const stationStats = useMemo(() => {
    const totalStations = new Set(filteredData.map(d => d.station_id)).size;
    const maxPolA = filteredData.length > 0 ? Math.max(...filteredData.map(d => d.pol_a)) : 100;
    const maxPolB = filteredData.length > 0 ? Math.max(...filteredData.map(d => d.pol_b)) : 100;

    return {
      totalStations,
      totalRecords: filteredData.length,
      filteredRecords: filteredData.length,
      lastUpdated: stationData.length > 0 ? stationData[0]?.sample_dt : undefined,
      maxPolA: maxPolA || 100,
      maxPolB: maxPolB || 100,
    };
  }, [stationData, filteredData]);


  // Apply filters to station data with optimized filtering
  useEffect(() => {
    let filtered = stationData;

    if (filters.stationQuery) {
      const query = filters.stationQuery.toLowerCase();
      filtered = filtered.filter(station =>
        station.station_name.toLowerCase().includes(query)
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(station => station.sample_dt >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(station => station.sample_dt <= filters.dateTo!);
    }

    if (filters.polAMin > 0) {
      filtered = filtered.filter(station => station.pol_a >= filters.polAMin);
    }

    if (filters.polBMin > 0) {
      filtered = filtered.filter(station => station.pol_b >= filters.polBMin);
    }

    if (spatialFilterGeometry) {
      filtered = filtered.filter(station => {
        try {
          if (spatialFilterGeometry.properties?.isRectangle && spatialFilterGeometry.properties?.bbox) {
            const [w, s, e, n] = spatialFilterGeometry.properties.bbox;
            return station.lon >= w && station.lon <= e && station.lat >= s && station.lat <= n;
          }

          const pt = turf.point([station.lon, station.lat]);
          
          if (spatialFilterGeometry.geometry.type === 'Polygon' || spatialFilterGeometry.geometry.type === 'MultiPolygon') {
            return turf.booleanPointInPolygon(pt, spatialFilterGeometry);
          } else if (spatialFilterGeometry.geometry.type === 'Point') {
            // Leaflet-draw circles are returned as points with a 'radius' property in meters
            if (spatialFilterGeometry.properties && spatialFilterGeometry.properties.radius) {
              const radiusKm = spatialFilterGeometry.properties.radius / 1000;
              return turf.distance(pt, spatialFilterGeometry, { units: 'kilometers' }) <= radiusKm;
            }
          }
        } catch (e) {
          console.error("Error applying spatial filter", e);
        }
        return true;
      });
    }

    setFilteredData(filtered);
  }, [stationData, filters, spatialFilterGeometry]);

  // Sync FULL station data to DuckDB (filtering happens in SQL)
  useEffect(() => {
    if (db && stationData.length > 0) {
      createTable('stations', stationData)
        .catch(e => console.error("DuckDB sync error:", e));
    }
  }, [stationData, db, createTable]);

  // Load data from indexedDB
  const loadDataFromDatabase = useCallback(async () => {
    if (!activeLocalProjectId) {
      setStationData([]);
      return;
    }

    console.log(`🔄 Starting load from storage for project ${activeLocalProjectId}...`);
    try {
      setIsLoading(true);
      const datasets = await getDatasets(activeLocalProjectId);

      if (datasets.length > 0) {
        let allData: StationData[] = [];
        for (const ds of datasets) {
            const transformedData: StationData[] = ds.rows.map((record: any) => ({
              station_id: String(record[ds.mapping?.id || 'id'] || record.station_id || Math.random().toString()),
              station_name: String(record[ds.mapping?.name || 'name'] || record.station_name || 'Desconhecida'),
              lat: parseFloat(record[ds.mapping?.lat || 'lat'] || record.latitude || record.lat || 0),
              lon: parseFloat(record[ds.mapping?.lon || 'lon'] || record.longitude || record.lon || 0),
              sample_dt: String(record[ds.mapping?.date || 'date'] || record.sample_dt || new Date().toISOString()),
              pol_a: parseFloat(record.pol_a || 0),
              pol_b: parseFloat(record.pol_b || 0),
              unit: record.unit || 'μg/m³'
            }));
            allData = [...allData, ...transformedData];
        }
        
        setStationData(allData);
        console.log(`📊 Loaded ${allData.length} records for project ${activeLocalProjectId}`);
      } else {
        setStationData([]);
      }
    } catch (error) {
      console.error('Failed to load data from storage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeLocalProjectId]);

  // Auto-load data from database when active project changes
  useEffect(() => {
    loadDataFromDatabase();
  }, [loadDataFromDatabase]);


  // Optimized export handler
  const handleExportData = useCallback(() => {
    if (filteredData.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      downloadCSV(filteredData, `pollution_data_filtered_${new Date().toISOString().split('T')[0]}.csv`);
      toast.success(`Exported ${filteredData.length} records successfully`);
    } catch (err) {
      toast.error('Failed to export data');
    }
  }, [filteredData]);

  // Handle server-side seeding of sample data
  const handleSeedData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/data/seed', { method: 'POST' });
      const result = await response.json();

      if (result.success) {
        toast.success(`Loaded ${result.recordsCount} records from sample file!`);
        // Reload data from database to update UI
        await loadDataFromDatabase();
      } else {
        throw new Error(result.error || 'Failed to seed project');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error seeding data';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [loadDataFromDatabase]);

  // Tooltip handlers for map interactions
  const handleStationHover = useCallback((station: any, x: number, y: number) => {
    console.log(`🎯 StationHover:`, station.station_id, 'coords:', x, y);
    const normalizedStation = {
      id: station.station_id || station.id,
      name: station.station_name || station.name,
      lat: station.lat,
      lon: station.lon,
      pol_a: station.pol_a,
      pol_b: station.pol_b,
      date: station.sample_dt || station.date
    };
    setActiveTooltip({ station: normalizedStation, x, y });
  }, []);

  const handleStationLeave = useCallback(() => {
    console.log(`👋 StationLeave called`);
    setActiveTooltip(null);
  }, []);

  // Safe padding for fitBounds to respect overlays (header/sidebar/legend)
  const getSafePadding = useCallback((): { top: number; left: number; right: number; bottom: number } => {
    const isDesktop =
      typeof window !== "undefined" && window.innerWidth >= 1024;
    const isTablet =
      typeof window !== "undefined" &&
      window.innerWidth >= 768 &&
      window.innerWidth < 1024;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    if (isMobile) {
      return { top: 60, left: 16, right: 16, bottom: 120 }; // More space for mobile controls
    } else if (isTablet) {
      return { top: 70, left: 32, right: 32, bottom: 100 }; // Tablet spacing
    } else {
      return { top: 80, left: 340, right: 16, bottom: 90 }; // Desktop with wider sidebar (320px + 20px margin)
    }
  }, []);

  // Tab content renderer for Sidebar/Overlay
  const renderSidebarContent = useCallback(() => {
    if (isLoading) return <LoadingSpinner message="Updating workspace..." />;

    switch (activeTab) {
      case 'projects':
        return (
          <div className="p-4 sm:p-6 space-y-6">
            <h3 className="text-sm font-bold text-foreground/40 uppercase tracking-widest mb-4">Project Workspace</h3>
            <ProjectManagerPanel />
          </div>
        );

      case 'data':
        return (
          <div className="p-4 sm:p-6 space-y-6 flex flex-col h-full overflow-y-auto custom-scrollbar font-sans">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-[12px] font-display font-bold text-foreground/40 uppercase tracking-widest">Data Management</h3>
               <Button 
                 variant="outline" 
                 size="sm" 
                 onClick={handleExportData}
                 className="h-8 text-[11px] font-medium gap-1.5 border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/5 text-foreground hover:bg-black/5 dark:hover:bg-white/10 backdrop-blur-sm"
               >
                 <Download className="w-3.5 h-3.5 text-primary" /> Export
               </Button>
             </div>
             <Suspense fallback={<LoadingSpinner message="Carregando importador..." />}>
               <DataImportPanel onImportSuccess={loadDataFromDatabase} />
             </Suspense>
          </div>
        );

      case 'dashboard':
        return (
          <div className="p-4 sm:p-5 flex flex-col h-full overflow-y-auto custom-scrollbar font-sans">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-[0_4px_12px_rgba(46,91,255,0.15)]">
                <PieChart className="text-primary w-4 h-4" />
              </div>
              <h3 className="text-sm font-display font-bold text-foreground tracking-wide">Pollution Dashboard</h3>
            </div>
            <Suspense fallback={<LoadingSpinner message="Loading dashboard..." />}>
              <PollutionDashboard
                stationData={filteredData}
                visiblePollutants={filters.visiblePollutants}
                externalAnalytics={spatialFilterGeometry ? undefined : duckAnalytics}
              />
            </Suspense>
          </div>
        );

      case 'filters':
        return (
          <div className="flex flex-col h-full text-foreground p-4">
            <Suspense fallback={<LoadingSpinner message="Carregando filtros..." />}>
              <EnvibaseFilterPanel />
            </Suspense>
          </div>
        );

      case 'layers':
        return (
          <div className="flex flex-col h-full text-foreground font-sans">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-black/5 dark:border-white/10">
              <p className="text-[11px] font-display font-bold text-primary/80 uppercase tracking-widest">Camadas de Visualização</p>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-2">

              {/* ── PADRÃO ── */}
              <p className="text-[9px] font-bold text-primary uppercase tracking-widest pb-1 pl-1">Padrão</p>

              {/* POI Markers */}
              <div className="flex items-center justify-between p-2.5 rounded-[14px] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-primary/40 transition-colors shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-foreground block">Marcadores POI</span>
                    <span className="text-[9px] text-foreground/50">Pins de localização padrão</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={mapSettings.showStations}
                  onChange={(e) => setMapSettings(prev => ({ ...prev, showStations: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
              </div>

              {/* ── ANALÍTICAS ── */}
              <p className="text-[9px] font-display font-bold text-primary uppercase tracking-widest pt-2 pb-1 pl-1">Analíticas</p>

              {/* Heatmap */}
              <div className="flex items-center justify-between p-2.5 rounded-[14px] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-primary/40 transition-colors shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-foreground block">Heatmap</span>
                    <span className="text-[9px] text-foreground/50">Densidade de poluição</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={mapSettings.showHeatmap}
                  onChange={(e) => setMapSettings(prev => ({ ...prev, showHeatmap: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
              </div>

              {mapSettings.showHeatmap && (
                <div className="space-y-1.5 pl-3 border-l-2 border-primary/30 ml-1">
                  <div>
                    <label className="text-[9px] font-bold text-foreground/40 uppercase block mb-1">
                      Intensidade: {Math.round(mapSettings.heatmapOpacity * 100)}%
                    </label>
                    <input
                      type="range" min="0.3" max="1" step="0.05"
                      value={mapSettings.heatmapOpacity}
                      onChange={(e) => setMapSettings(prev => ({ ...prev, heatmapOpacity: parseFloat(e.target.value) }))}
                      className="w-full accent-primary h-1.5 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-foreground/40 uppercase block mb-1">
                      Raio: {mapSettings.heatmapRadius}px
                    </label>
                    <input
                      type="range" min="10" max="60" step="5"
                      value={mapSettings.heatmapRadius}
                      onChange={(e) => setMapSettings(prev => ({ ...prev, heatmapRadius: parseInt(e.target.value) }))}
                      className="w-full accent-primary h-1.5 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Station Clustering */}
              <div className="flex items-center justify-between p-2.5 rounded-[14px] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-primary/40 transition-colors shadow-sm mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Calculator className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-foreground block">Station Clustering</span>
                    <span className="text-[9px] text-foreground/50">Agrupa estações únicas</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={mapSettings.enableStationClustering}
                  onChange={(e) => setMapSettings(prev => ({ ...prev, enableStationClustering: e.target.checked, enableRecordClustering: false }))}
                  className="w-4 h-4 accent-primary"
                />
              </div>

              {/* Record Clustering */}
              <div className="flex items-center justify-between p-2.5 rounded-[14px] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-primary/40 transition-colors shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Filter className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-foreground block">Record Clustering</span>
                    <span className="text-[9px] text-foreground/50">Agrupa leituras por estação</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={mapSettings.enableRecordClustering}
                  onChange={(e) => setMapSettings(prev => ({ ...prev, enableRecordClustering: e.target.checked, enableStationClustering: false }))}
                  className="w-4 h-4 accent-primary"
                />
              </div>

              {/* Record Count */}
              <div className="flex items-center justify-between p-2.5 rounded-[14px] bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:border-primary/40 transition-colors shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-foreground block">Record Count</span>
                    <span className="text-[9px] text-foreground/50">Exibe contagem por estação</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={mapSettings.showRecordCount}
                  onChange={(e) => setMapSettings(prev => ({ ...prev, showRecordCount: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
              </div>

              {/* ── AVANÇADO ── */}
              <p className="text-[9px] font-display font-bold text-amber-500 uppercase tracking-widest pt-2 pb-1 pl-1">Avançado</p>

              {/* Advanced Chart Markers */}
              <div className="flex items-center justify-between p-2.5 rounded-[14px] bg-amber-500/5 border border-amber-500/20 hover:border-amber-400/40 transition-colors shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-foreground block">Ícones com Gráficos</span>
                    <span className="text-[9px] text-foreground/50">Visualização avançada interativa</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={mapSettings.showAdvancedMarkers}
                  onChange={(e) => setMapSettings(prev => ({ ...prev, showAdvancedMarkers: e.target.checked }))}
                  className="w-4 h-4 accent-amber-500"
                />
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="flex flex-col h-full text-foreground">
            {/* Header */}
            <div className="px-5 pt-4 pb-2 border-b border-border/20">
              <p className="text-[10px] font-bold text-primary/80 uppercase tracking-widest">Configurações</p>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-1">

              {/* ── APARÊNCIA ── */}
              <p className="text-[9px] font-bold text-primary uppercase tracking-widest pb-1">Aparência</p>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-foreground/[0.03] border-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    {isDarkMode ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Modo</span>
                    <span className="text-[9px] text-foreground/40">{isDarkMode ? 'Tema escuro ativo' : 'Tema claro ativo'}</span>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className="relative w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0"
                  style={{ background: isDarkMode ? 'var(--primary-hex, #2E5BFF)' : 'rgba(0,0,0,0.1)' }}
                  aria-label="Toggle dark mode"
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                    style={{ transform: isDarkMode ? 'translateX(18px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>

              {/* ── IDIOMA ── */}
              <p className="text-[9px] font-bold text-primary uppercase tracking-widest pt-1.5 pb-1">Idioma</p>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-foreground/[0.03] border-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-sm">🌐</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-foreground block">Português (BR)</span>
                    <span className="text-[9px] text-foreground/40">Mais idiomas em breve</span>
                  </div>
                </div>
                <span className="text-[9px] text-foreground/30 font-bold uppercase">PT-BR</span>
              </div>

              {/* ── CHAVES DE API ── */}
              <div className="pt-3 mt-1 border-t border-[#1E2D4A]">
                <p className="text-[9px] font-bold text-[#2E5BFF] uppercase tracking-widest mb-2">Chaves de API</p>
                <LLMSettings />
              </div>
            </div>
          </div>
        );

      case 'discovery':
        return (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Globe className="text-white w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Envibase Discovery</h3>
            </div>

            <p className="text-xs text-foreground/60 leading-relaxed font-medium">
              Explore o ecossistema de dados ambientais globais através do nosso motor de descoberta baseado em PostGIS e Geocatalogs.
            </p>

            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
              <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Status do MVP</h4>
              <div className="flex items-center gap-2 text-xs text-primary/80 font-bold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Interface Discovery Ativada</span>
              </div>
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white h-11 rounded-xl shadow-lg shadow-primary/20 text-xs font-bold"
              onClick={() => window.open('/discovery', '_blank')}
            >
              Abrir Discovery Fullscreen <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        );

       case 'ai':
        return (
          <div className="h-full flex flex-col p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
               </div>
               <h3 className="text-base font-bold text-foreground">AI Assistant</h3>
            </div>
            <div className="flex-1 overflow-hidden min-h-[400px]">
               <ChatBot stationData={filteredData} />
            </div>
          </div>
        );

      case 'statistics':
        return (
          <div className="p-4 sm:p-6 h-full overflow-y-auto no-scrollbar">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-primary" />
               </div>
               <h3 className="text-base font-bold text-foreground">Análise Avançada</h3>
            </div>
            <Suspense fallback={<LoadingSpinner message="Loading statistics..." />}>
              <StatisticsPanel
                data={filteredData}
                visiblePollutants={filters.visiblePollutants}
                maxPolA={stationStats.maxPolA}
                maxPolB={stationStats.maxPolB}
                isSpatiallyFiltered={!!spatialFilterGeometry}
              />
            </Suspense>
          </div>
        );

      default:
        return null;
    }
  }, [activeTab, isLoading, filteredData, stationStats, stationData.length, filters, mapSettings, handleExportData, loadDataFromDatabase, isDarkMode, toggleDarkMode]);

  // All non-map tabs show as a floating overlay panel on the left
  const isOverlayPane = activeTab !== 'map';
  // Dark-themed panels (filter panel uses custom dark forest-green styling)
  const isDarkPanel = activeTab === 'filters';
  // Navy panels (match the sidebar dark navy #0A192F palette)
  const isNavyPanel = activeTab === 'layers' || activeTab === 'settings';
  // Panels that manage their own scrolling and layout (no outer padding/scroll needed)
  const isSelfContainedPanel = isDarkPanel || isNavyPanel;

  return (
    <MapCommandProvider onExecuteCommands={() => { }}>
      <div className="min-h-screen bg-white dark:bg-background transition-colors duration-300 font-['Inter',sans-serif]">
        <ProfessionalHeader
          stationCount={stationStats.totalStations}
          recordCount={stationStats.totalRecords}
          activeProject={activeProject}
          user={user}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isMenuOpen={isSidebarOpen}
        />

        <div className="flex h-[calc(100vh-57px)] overflow-hidden relative">
          {/* Main Navigation Sidebar */}
          <SlimSidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              // Clicking the active tab collapses the panel back to fullscreen map
              setActiveTab(prev => (prev === tab ? 'map' : tab) as any);
              if (window.innerWidth < 1024) setIsSidebarOpen(false);
            }}
          />

          {/* Core Workspace Area */}
          <div className="flex-1 relative flex overflow-hidden">
            {/* Map Canvas — Foundation */}
            <main className="flex-1 relative bg-[#f1f3f5] dark:bg-[#0d1210]">
              <Suspense fallback={<LoadingSpinner message="Deploying Mapping Engine..." />}>
                <MapContainer
                  stationData={filteredData}
                  showStationMarkers={mapSettings.showStations}
                  showAdvancedMarkers={mapSettings.showAdvancedMarkers}
                  showHeatmap={mapSettings.showHeatmap}
                  heatmapOpacity={mapSettings.heatmapOpacity}
                  heatmapRadius={mapSettings.heatmapRadius}
                  enableStationClustering={mapSettings.enableStationClustering}
                  enableRecordClustering={mapSettings.enableRecordClustering}
                  showRecordCount={mapSettings.showRecordCount}
                  onStationHover={handleStationHover}
                  onStationLeave={handleStationLeave}
                  visiblePollutants={filters.visiblePollutants}
                  onSpatialFilterUpdate={setSpatialFilterGeometry}
                />
              </Suspense>

              {/* Floating Overlay Panels — always on the LEFT */}
              {isOverlayPane && (
                <div className="absolute top-4 left-4 bottom-4 w-[400px] z-[1000] pointer-events-none">
                  <div className={cn(
                    "w-full h-full pointer-events-auto border rounded-[2rem] flex flex-col animate-in slide-in-from-left-8 fade-in duration-400 ease-out overflow-hidden backdrop-blur-2xl",
                    "bg-white/80 dark:bg-[#0A192F]/75 border-black/5 dark:border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.50)]"
                  )}>
                    {isSelfContainedPanel ? (
                      <div className="flex-1 overflow-hidden">
                        {renderSidebarContent()}
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth p-1">
                        {renderSidebarContent()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>

        {/* Station Tooltip — Premium Styling */}
        {activeTooltip && (
          <div
            className="fixed z-[9999] animate-in fade-in zoom-in-95 pointer-events-none"
            style={{
              left: `${activeTooltip.x}px`,
              top: `${activeTooltip.y}px`,
              transform: "translate(-50%, -100%)",
              marginTop: "-16px",
            }}
          >
            <div className="relative group">
               <div className="absolute -inset-2 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
               <StationTooltip
                 station={activeTooltip.station}
                 maxPolA={stationStats.maxPolA}
                 maxPolB={stationStats.maxPolB}
                 visiblePollutants={filters.visiblePollutants}
               />
            </div>
          </div>
        )}
      </div>
    </MapCommandProvider>
  );
};

export default memo(ProfessionalWebGISApp);