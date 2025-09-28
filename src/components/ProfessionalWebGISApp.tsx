import React, { memo, useCallback, useMemo, useRef, useState, useEffect, Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Download, AlertCircle, CheckCircle, Loader2, MapPin, BarChart3, Settings, Filter } from "lucide-react";
import { toast } from "sonner";
import { importCSVFile, downloadCSV, StationData } from "@/utils/csvImporter";

// Lazy load heavy components for better performance
const MapContainer = lazy(() => import("./MapContainer"));
const PollutionDashboard = lazy(() => import("./PollutionDashboard"));
const DataFilterPanel = lazy(() => import("./DataFilterPanel"));

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
  dateFrom: string | null;
  dateTo: string | null;
  polAMin: number;
  polBMin: number;
}

interface MapSettings {
  showStations: boolean;
  showHeatmap: boolean;
  heatmapOpacity: number;
  heatmapRadius: number;
  enableClustering: boolean;
}

const DEFAULT_FILTERS: StationFilters = {
  stationQuery: "",
  dateFrom: null,
  dateTo: null,
  polAMin: 0,
  polBMin: 0,
};

const DEFAULT_MAP_SETTINGS: MapSettings = {
  showStations: true,
  showHeatmap: true,
  heatmapOpacity: 0.7,
  heatmapRadius: 25,
  enableClustering: false,
};

// Loading Component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-3" />
    <span className="text-sm text-gray-600">{message}</span>
  </div>
);

// Professional Header Component
const ProfessionalHeader: React.FC<{
  stationCount: number;
  recordCount: number;
  onMenuToggle: () => void;
  isMenuOpen: boolean;
}> = memo(({ stationCount, recordCount, onMenuToggle, isMenuOpen }) => (
  <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="lg:hidden"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            <div className="w-5 h-5 flex flex-col justify-center gap-1">
              <div className={`h-0.5 bg-current transition-all ${isMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <div className={`h-0.5 bg-current transition-all ${isMenuOpen ? 'opacity-0' : ''}`} />
              <div className={`h-0.5 bg-current transition-all ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">WebGIS Platform</h1>
              <p className="text-xs text-gray-600">Environmental Data Visualization</p>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-sm font-semibold text-blue-600">{stationCount}</div>
              <div className="text-xs text-gray-500">Stations</div>
            </div>
            <div className="w-px h-8 bg-gray-300" />
            <div className="text-center">
              <div className="text-sm font-semibold text-emerald-600">{recordCount.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Records</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
));

// Professional Sidebar Component
const ProfessionalSidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = memo(({ isOpen, onClose, children }) => (
  <>
    {/* Mobile Overlay */}
    {isOpen && (
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
    )}
    
    {/* Sidebar - Increased width from w-80 to w-96 */}
    <aside className={`
      fixed top-0 left-0 h-full w-96 bg-white border-r border-gray-200 shadow-xl z-50
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0 lg:static lg:shadow-none
    `}>
      <div className="h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Control Panel</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
              aria-label="Close sidebar"
            >
              ×
            </Button>
          </div>
        </div>
        
        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </aside>
  </>
));

// Main Application Component
const ProfessionalWebGISApp: React.FC = () => {
  // Core state management
  const [stationData, setStationData] = useState<StationData[]>([]);
  const [filteredData, setFilteredData] = useState<StationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StationFilters>(DEFAULT_FILTERS);
  const [mapSettings, setMapSettings] = useState<MapSettings>(DEFAULT_MAP_SETTINGS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'data' | 'dashboard' | 'filters' | 'settings'>('data');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoized calculations for performance
  const stationStats = useMemo(() => ({
    totalStations: new Set(stationData.map(d => d.station_id)).size,
    totalRecords: stationData.length,
    filteredRecords: filteredData.length,
    lastUpdated: stationData.length > 0 ? stationData[0]?.sample_dt : undefined,
  }), [stationData, filteredData]);

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

    setFilteredData(filtered);
  }, [stationData, filters]);

  // Optimized file upload handler
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await importCSVFile(file);
      setStationData(data);
      setError(null);
      toast.success(`Successfully imported ${data.length} station records from ${new Set(data.map(d => d.station_id)).size} stations`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import CSV file';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

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

  // Safe padding for fitBounds to respect overlays (header/sidebar/legend)
  const getSafePadding = useCallback((): maplibregl.PaddingOptions => {
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
      return { top: 80, left: 400, right: 16, bottom: 90 }; // Desktop with wider sidebar (was 460, now 400)
    }
  }, []);

  // Tab content renderer
  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'data':
        return (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-base font-semibold mb-4">Data Management</h3>
              
              {/* File Upload */}
              <div className="space-y-4">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  className="hidden"
                  id="csv-upload"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import CSV Data
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleExportData}
                  disabled={filteredData.length === 0}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Filtered Data
                </Button>
              </div>

              {/* Statistics */}
              <div className="bg-gray-50 rounded-lg p-4 mt-6">
                <h4 className="text-sm font-medium mb-3">Statistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-base font-semibold text-blue-600">{stationStats.totalRecords.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Total Records</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-semibold text-emerald-600">{stationStats.filteredRecords.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Filtered</div>
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              {stationData.length > 0 && !error && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-emerald-800 font-medium">Data loaded successfully!</p>
                      <p className="text-xs text-emerald-700 mt-1">
                        Check the map and dashboard for visualizations.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-red-800 font-medium">Import Error</p>
                      <p className="text-xs text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="p-6">
            <h3 className="text-base font-semibold mb-4">Analytics Dashboard</h3>
            <Suspense fallback={<LoadingSpinner message="Loading dashboard..." />}>
              <PollutionDashboard stationData={filteredData} />
            </Suspense>
          </div>
        );

      case 'filters':
        return (
          <div className="p-6">
            <h3 className="text-base font-semibold mb-4">Data Filters</h3>
            <Suspense fallback={<LoadingSpinner message="Loading filters..." />}>
              <DataFilterPanel value={filters} onChange={setFilters} />
            </Suspense>
          </div>
        );

      case 'settings':
        return (
          <div className="p-6 space-y-6">
            <h3 className="text-base font-semibold mb-4">Map Settings</h3>
            
            {/* Layer Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Station Markers</span>
                <Button
                  variant={mapSettings.showStations ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMapSettings(prev => ({ ...prev, showStations: !prev.showStations }))}
                >
                  {mapSettings.showStations ? 'ON' : 'OFF'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Heatmap</span>
                <Button
                  variant={mapSettings.showHeatmap ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMapSettings(prev => ({ ...prev, showHeatmap: !prev.showHeatmap }))}
                >
                  {mapSettings.showHeatmap ? 'ON' : 'OFF'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Clustering</span>
                <Button
                  variant={mapSettings.enableClustering ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMapSettings(prev => ({ ...prev, enableClustering: !prev.enableClustering }))}
                >
                  {mapSettings.enableClustering ? 'ON' : 'OFF'}
                </Button>
              </div>
            </div>

            {/* Heatmap Settings */}
            {mapSettings.showHeatmap && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Opacity: {Math.round(mapSettings.heatmapOpacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={mapSettings.heatmapOpacity}
                    onChange={(e) => setMapSettings(prev => ({ ...prev, heatmapOpacity: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">
                    Radius: {mapSettings.heatmapRadius}px
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={mapSettings.heatmapRadius}
                    onChange={(e) => setMapSettings(prev => ({ ...prev, heatmapRadius: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  }, [activeTab, isLoading, filteredData, stationStats, stationData.length, error, mapSettings, filters, handleFileUpload, handleExportData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <ProfessionalHeader
        stationCount={stationStats.totalStations}
        recordCount={stationStats.totalRecords}
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isMenuOpen={isSidebarOpen}
      />

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <ProfessionalSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        >
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-white">
            <nav className="flex">
              {[
                { id: 'data', label: 'Data', icon: Upload },
                { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'filters', label: 'Filters', icon: Filter },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 py-3 px-2 text-xs font-medium
                    border-b-2 transition-colors
                    ${activeTab === id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </ProfessionalSidebar>

        {/* Map Content */}
        <main className="flex-1 relative">
          <Suspense fallback={<LoadingSpinner message="Loading map..." />}>
            <MapContainer
              stationData={filteredData}
              showStationMarkers={mapSettings.showStations}
              showHeatmap={mapSettings.showHeatmap}
              heatmapOpacity={mapSettings.heatmapOpacity}
              heatmapRadius={mapSettings.heatmapRadius}
              enableClustering={mapSettings.enableClustering}
            />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default memo(ProfessionalWebGISApp);