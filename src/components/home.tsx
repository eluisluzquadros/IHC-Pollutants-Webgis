import React from "react";
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
import ProfessionalHeader from "./ProfessionalHeader";
import { importCSVFile, downloadCSV, StationData } from "@/utils/csvImporter";
import { toast } from "sonner";

interface HomeProps {
  // Add any props if needed
}

const Home: React.FC<HomeProps> = () => {
  const [stationData, setStationData] = React.useState<StationData[]>([]);
  const [filteredData, setFilteredData] = React.useState<StationData[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showAbout, setShowAbout] = React.useState(false);
  const [filters, setFilters] = React.useState<StationFilters>({
    stationQuery: "",
    dateFrom: null,
    dateTo: null,
    polAMin: 0,
    polBMin: 0,
  });
  
  const [activeTooltip, setActiveTooltip] = React.useState<{
    station: {
      id: string;
      name: string;
      lat: number;
      lon: number;
      sampleDate: string;
      polA: number;
      polB: number;
      unit: string;
    };
    x: number;
    y: number;
  } | null>(null);

  const [mapSettings, setMapSettings] = React.useState({
    showStations: true,
    showHeatmap: true,
    heatmapOpacity: 0.7,
    heatmapRadius: 25,
    enableClustering: false,
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Apply filters to station data
  React.useEffect(() => {
    let filtered = stationData;

    if (filters.stationQuery) {
      filtered = filtered.filter(station =>
        station.station_name.toLowerCase().includes(filters.stationQuery.toLowerCase())
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const handleExportData = () => {
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
  };

  const handleStationHover = (station: any, x: number, y: number) => {
    setActiveTooltip({ station, x, y });
  };

  const handleStationLeave = () => {
    setActiveTooltip(null);
  };

  // Layer control handlers
  const handleToggleStationMarkers = (enabled: boolean) => {
    setMapSettings(prev => ({ ...prev, showStations: enabled }));
  };

  const handleToggleHeatmap = (enabled: boolean) => {
    setMapSettings(prev => ({ ...prev, showHeatmap: enabled }));
  };

  const handleHeatmapOpacityChange = (opacity: number) => {
    setMapSettings(prev => ({ ...prev, heatmapOpacity: opacity }));
  };

  const handleHeatmapRadiusChange = (radius: number) => {
    setMapSettings(prev => ({ ...prev, heatmapRadius: radius }));
  };

  const handleToggleClustering = (enabled: boolean) => {
    setMapSettings(prev => ({ ...prev, enableClustering: enabled }));
  };

  const handleResetView = () => {
    if ((window as any).resetMapView) {
      (window as any).resetMapView();
    } else {
      console.log('Reset view function not available yet');
    }
  };

  // Professional Data Management Content
  const dataManagementContent = (
    <div className="space-y-8">
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
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="btn-professional btn-professional-primary w-full"
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
              <span className="font-semibold text-blue-600 text-sm">{stationData.length.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-professional-body">Filtered Records:</span>
              <span className="font-semibold text-emerald-600 text-sm">{filteredData.length.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-professional-body">Unique Stations:</span>
              <span className="font-semibold text-purple-600 text-sm">
                {new Set(stationData.map(d => d.station_id)).size}
              </span>
            </div>
          </div>
        </div>

        {/* Professional Status Messages */}
        {stationData.length > 0 && !error && (
          <div className="card-professional-compact bg-emerald-50 border-emerald-200">
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
          <div className="card-professional-compact bg-red-50 border-red-200">
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
  );

  // Professional Layer Control Content
  const layerControlContent = (
    <LayerControlPanel
      onToggleStationMarkers={handleToggleStationMarkers}
      onToggleHeatmap={handleToggleHeatmap}
      onHeatmapOpacityChange={handleHeatmapOpacityChange}
      onHeatmapRadiusChange={handleHeatmapRadiusChange}
      onToggleClustering={handleToggleClustering}
      onExportData={handleExportData}
      onResetView={handleResetView}
    />
  );

  return (
    <div className="layout-professional">
      {/* Professional Header */}
      <ProfessionalHeader
        stationCount={new Set(stationData.map(d => d.station_id)).size}
        recordCount={stationData.length}
        lastUpdated={stationData.length > 0 ? stationData[0]?.sample_dt : undefined}
        stationData={stationData}
        onInfoClick={() => setShowAbout(true)}
      />

      {/* Main Layout */}
      <div className="layout-main">
        {/* Sidebar */}
        <div className="layout-sidebar">
          <ModernSidebar
            dataManagementContent={dataManagementContent}
            dashboardContent={<PollutionDashboard stationData={filteredData} />}
            chatBotContent={<ChatBot stationData={filteredData} />}
            filterContent={<DataFilterPanel value={filters} onChange={setFilters} />}
            layerControlContent={layerControlContent}
            stationCount={new Set(stationData.map(d => d.station_id)).size}
            recordCount={stationData.length}
          />
        </div>

        {/* Map Content */}
        <div className="layout-content">
          <MapContainer
            stationData={filteredData}
            showStationMarkers={mapSettings.showStations}
            showHeatmap={mapSettings.showHeatmap}
            heatmapOpacity={mapSettings.heatmapOpacity}
            heatmapRadius={mapSettings.heatmapRadius}
            enableClustering={mapSettings.enableClustering}
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
        >
          <StationTooltip station={activeTooltip.station} />
        </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card-professional-elevated max-w-2xl w-full animate-professional-scale-in">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-professional-heading">About WebGIS Platform</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAbout(false)}
                className="btn-professional btn-professional-ghost"
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
  );
};

export default Home;