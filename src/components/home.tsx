import React, { memo, useCallback, useMemo, useRef, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Download, FileText, AlertCircle, CheckCircle } from "lucide-react";
import MapContainer from "./MapContainer";
import LayerControlPanel from "./LayerControlPanel";
import StationTooltip from "./StationTooltip";
import DataFilterPanel, { StationFilters } from "./DataFilterPanel";
import PollutionDashboard from "./PollutionDashboard";
import ChatBot from "./ChatBot";
import ModernSidebar from "./ModernSidebar";
import AppBar from "./AppBar";
import { importCSVFile, downloadCSV, StationData } from "@/utils/csvImporter";
import { toast } from "sonner";
import { MapCommandProvider } from "@/contexts/MapCommandContext";
import { MapCommand } from "@/services/openaiService";

/**
 * Professional WebGIS Home Component
 * 
 * Main application component that orchestrates the entire WebGIS platform
 * for environmental data visualization. Features include:
 * - Interactive map with pollution data visualization
 * - Professional sidebar with data management and analytics
 * - Real-time filtering and data export capabilities
 * - Responsive design optimized for all devices
 * 
 * @component
 */

interface HomeProps {
  /** Optional CSS class name for styling */
  className?: string;
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

interface MapSettings {
  showStations: boolean;
  showHeatmap: boolean;
  heatmapOpacity: number;
  heatmapRadius: number;
  enableStationClustering: boolean;
  enableRecordClustering: boolean;
  showRecordCount: boolean;
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
  enableStationClustering: false,
  enableRecordClustering: false,
  showRecordCount: false,
};

const Home: React.FC<HomeProps> = memo(({ className = "" }) => {
  // Core state management
  const [stationData, setStationData] = useState<StationData[]>([]);
  const [filteredData, setFilteredData] = useState<StationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [filters, setFilters] = useState<StationFilters>(DEFAULT_FILTERS);
  const [activeTooltip, setActiveTooltip] = useState<TooltipState | null>(null);
  const [mapSettings, setMapSettings] = useState<MapSettings>(DEFAULT_MAP_SETTINGS);
  
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
      
      console.log(`Successfully imported ${data.length} station records`);
      if (data.length > 0) {
        console.log('Sample data:', data.slice(0, 3));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import CSV file';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('CSV import error:', err);
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
      console.error('Export error:', err);
    }
  }, [filteredData]);

  // Optimized tooltip handlers
  const handleStationHover = useCallback((station: any, x: number, y: number) => {
    console.log(`🎯 HOME: handleStationHover called with station:`, station.station_id, 'coords:', x, y);
    // Normalize station data to match StationTooltip interface
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
    console.log(`👋 HOME: handleStationLeave called`);
    setActiveTooltip(null);
  }, []);

  // Optimized layer control handlers
  const handleToggleStationMarkers = useCallback((enabled: boolean) => {
    setMapSettings(prev => ({ ...prev, showStations: enabled }));
  }, []);

  const handleToggleHeatmap = useCallback((enabled: boolean) => {
    setMapSettings(prev => ({ ...prev, showHeatmap: enabled }));
  }, []);

  const handleHeatmapOpacityChange = useCallback((opacity: number) => {
    setMapSettings(prev => ({ ...prev, heatmapOpacity: opacity }));
  }, []);

  const handleHeatmapRadiusChange = useCallback((radius: number) => {
    setMapSettings(prev => ({ ...prev, heatmapRadius: radius }));
  }, []);

  const handleToggleStationClustering = useCallback((enabled: boolean) => {
    setMapSettings(prev => ({ ...prev, enableStationClustering: enabled }));
  }, []);

  const handleToggleRecordClustering = useCallback((enabled: boolean) => {
    setMapSettings(prev => ({ ...prev, enableRecordClustering: enabled }));
  }, []);

  const handleToggleRecordCount = useCallback((enabled: boolean) => {
    setMapSettings(prev => ({ ...prev, showRecordCount: enabled }));
  }, []);

  const handleResetView = useCallback(() => {
    if ((window as any).resetMapView) {
      (window as any).resetMapView();
    } else {
      console.log('Reset view function not available yet');
    }
  }, []);

  // Map command handler for AI interactions
  const [focusedStationId, setFocusedStationId] = useState<string | null>(null);
  const [highlightedStationIds, setHighlightedStationIds] = useState<string[]>([]);
  
  // Mobile responsive state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMapCommands = useCallback((commands: MapCommand[]) => {
    commands.forEach(command => {
      console.log('🎯 Executing map command:', command.type, command.data);
      
      switch (command.type) {
        case 'focus_station':
          if (command.data.stationId) {
            setFocusedStationId(command.data.stationId);
            // Also highlight this station
            setHighlightedStationIds([command.data.stationId]);
            toast.success(`Focusing on station ${command.data.stationId}`);
          }
          break;

        case 'highlight_stations':
          if (command.data.stationIds && Array.isArray(command.data.stationIds)) {
            setHighlightedStationIds(command.data.stationIds);
            toast.success(`Highlighting ${command.data.stationIds.length} stations`);
          }
          break;

        case 'filter_data':
          const newFilters: Partial<StationFilters> = {};
          if (command.data.polA_min !== undefined) newFilters.polAMin = command.data.polA_min;
          if (command.data.polB_min !== undefined) newFilters.polBMin = command.data.polB_min;
          if (command.data.date_from) newFilters.dateFrom = command.data.date_from;
          if (command.data.date_to) newFilters.dateTo = command.data.date_to;
          if (command.data.stationQuery) newFilters.stationQuery = command.data.stationQuery;
          
          setFilters(prev => ({ ...prev, ...newFilters }));
          toast.success('Filters applied automatically');
          break;

        case 'set_zoom':
          // This will be handled by MapContainer when it receives the command
          if ((window as any).setMapZoom) {
            (window as any).setMapZoom(command.data.level, command.data.center);
          }
          break;

        case 'apply_time_filter':
          if (command.data.days) {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - command.data.days);
            
            setFilters(prev => ({
              ...prev,
              dateFrom: startDate.toISOString().split('T')[0],
              dateTo: endDate.toISOString().split('T')[0]
            }));
            toast.success(`Filtered to last ${command.data.days} days`);
          }
          break;

        default:
          console.warn('Unknown map command type:', command.type);
      }
    });
  }, []);

  // Memoized content components for better performance
  const dataManagementContent = useMemo(() => (
    <div className="space-y-8 animate-professional-fade-in">
      <div className="text-center">
        <h3 className="text-professional-heading">Data Management</h3>
        <p className="text-professional-body">Import and export pollution monitoring data</p>
      </div>
      
      <div className="space-y-6">
        {/* Professional File Upload */}
        <div>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isLoading}
            className="hidden"
            id="csv-upload"
            aria-label="Upload CSV file"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="btn-professional btn-professional-primary w-full"
            aria-label={isLoading ? "Importing CSV file..." : "Import CSV data file"}
          >
            {isLoading ? (
              <>
                <div className="loading-professional mr-2" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV Data
              </>
            )}
          </Button>
        </div>

        {/* Professional Export Button */}
        <Button
          onClick={handleExportData}
          disabled={filteredData.length === 0}
          className="btn-professional btn-professional-outline w-full"
          aria-label={`Export ${filteredData.length} filtered records`}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Filtered Data
        </Button>

        {/* Professional Data Statistics */}
        <div className="card-professional-compact bg-gradient-to-br from-gray-50 to-gray-100">
          <h4 className="text-professional-subheading">Data Statistics</h4>
          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-professional-body">Total Records:</span>
              <span className="font-semibold text-blue-600 text-sm">{stationStats.totalRecords.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-professional-body">Filtered Records:</span>
              <span className="font-semibold text-emerald-600 text-sm">{stationStats.filteredRecords.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-professional-body">Unique Stations:</span>
              <span className="font-semibold text-purple-600 text-sm">
                {stationStats.totalStations}
              </span>
            </div>
          </div>
        </div>

        {/* Professional Status Messages */}
        {stationData.length > 0 && !error && (
          <div className="card-professional-compact bg-emerald-50 border-emerald-200 animate-professional-fade-in">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-professional-body text-emerald-800 font-medium">Data loaded successfully!</p>
                <p className="text-professional-caption text-emerald-700 mt-2">
                  Check the map and dashboard for visualizations and insights.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="card-professional-compact bg-red-50 border-red-200 animate-professional-fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-professional-body text-red-800 font-medium">Import Error</p>
                <p className="text-professional-caption text-red-700 mt-2">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  ), [isLoading, filteredData.length, stationStats, stationData.length, error, handleFileUpload, handleExportData]);

  const layerControlContent = useMemo(() => (
    <LayerControlPanel
      onToggleStationMarkers={handleToggleStationMarkers}
      onToggleHeatmap={handleToggleHeatmap}
      onHeatmapOpacityChange={handleHeatmapOpacityChange}
      onHeatmapRadiusChange={handleHeatmapRadiusChange}
      onToggleClustering={handleToggleStationClustering}
      onToggleRecordCount={handleToggleRecordCount}
      onExportData={handleExportData}
      onResetView={handleResetView}
    />
  ), [
    handleToggleStationMarkers,
    handleToggleHeatmap,
    handleHeatmapOpacityChange,
    handleHeatmapRadiusChange,
    handleToggleStationClustering,
    handleToggleRecordCount,
    handleExportData,
    handleResetView
  ]);

  return (
    <MapCommandProvider onExecuteCommands={handleMapCommands}>
      <div className={`webgis-app-grid ${className}`}>
        {/* App Bar Header */}
        <AppBar
          stationCount={stationStats.totalStations}
          recordCount={stationStats.totalRecords}
          lastUpdated={stationStats.lastUpdated}
          stationData={stationData}
          onInfoClick={() => setShowAbout(true)}
          onUploadClick={() => fileInputRef.current?.click()}
          onExportClick={handleExportData}
          onResetView={handleResetView}
          onAIAssistantClick={() => {/* This will focus AI Assistant tab in sidebar */}}
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />

        {/* Main Content Grid */}
        <div className="webgis-content-grid">
          {/* Sidebar */}
          <div className={`webgis-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
            <ModernSidebar
              dataManagementContent={dataManagementContent}
              dashboardContent={<PollutionDashboard stationData={filteredData} />}
              chatBotContent={<ChatBot stationData={filteredData} />}
              filterContent={<DataFilterPanel value={filters} onChange={setFilters} />}
              layerControlContent={layerControlContent}
              stationCount={stationStats.totalStations}
              recordCount={stationStats.totalRecords}
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </div>
          
          {/* Mobile Overlay */}
          {isMobileMenuOpen && (
            <div 
              className="md:hidden fixed inset-0 bg-black/50 z-40" 
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Map Canvas */}
          <div className="webgis-map-canvas">
            <MapContainer
              stationData={filteredData}
              showStationMarkers={mapSettings.showStations}
              showHeatmap={mapSettings.showHeatmap}
              heatmapOpacity={mapSettings.heatmapOpacity}
              heatmapRadius={mapSettings.heatmapRadius}
              enableStationClustering={mapSettings.enableStationClustering}
              enableRecordClustering={mapSettings.enableRecordClustering}
              showRecordCount={mapSettings.showRecordCount}
              onStationHover={handleStationHover}
              onStationLeave={handleStationLeave}
              focusedStationId={focusedStationId}
              highlightedStationIds={highlightedStationIds}
            />
          </div>
        </div>

      {/* Professional Station Tooltip */}
      {activeTooltip && (
        <div
          className="absolute z-50 animate-professional-fade-in"
          style={{
            left: `${activeTooltip.x}px`,
            top: `${activeTooltip.y}px`,
            transform: "translate(-50%, -100%)",
            marginTop: "-12px",
          }}
          role="tooltip"
          aria-live="polite"
        >
          <StationTooltip station={activeTooltip.station} />
        </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="about-title"
        >
          <div className="card-professional-elevated max-w-2xl w-full animate-professional-scale-in">
            <div className="flex items-start justify-between mb-6">
              <h2 id="about-title" className="text-professional-heading">About WebGIS Platform</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAbout(false)}
                className="btn-professional btn-professional-ghost"
                aria-label="Close about dialog"
              >
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-professional-body">
                This WebGIS platform provides interactive visualization of environmental pollution data 
                using MapLibre GL JS. The platform features custom SVG markers with dual-bar charts 
                representing pollution levels, heatmap visualization, and comprehensive data analysis tools.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="card-professional-compact">
                  <h4 className="text-professional-subheading">Key Features</h4>
                  <ul className="text-professional-body space-y-1 mt-2">
                    <li>• Interactive station markers</li>
                    <li>• Pollution density heatmaps</li>
                    <li>• Real-time data filtering</li>
                    <li>• CSV data import/export</li>
                    <li>• AI-powered analysis</li>
                  </ul>
                </div>
                <div className="card-professional-compact">
                  <h4 className="text-professional-subheading">Technology Stack</h4>
                  <ul className="text-professional-body space-y-1 mt-2">
                    <li>• React + TypeScript</li>
                    <li>• MapLibre GL JS</li>
                    <li>• Tailwind CSS</li>
                    <li>• Recharts</li>
                    <li>• Shadcn/ui</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </MapCommandProvider>
  );
});

Home.displayName = 'Home';

export default Home;