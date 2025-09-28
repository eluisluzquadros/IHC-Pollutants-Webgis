import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Map, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Info,
  ExternalLink,
  Github
} from 'lucide-react';
import { StationData } from '@/utils/csvImporter';

interface ProfessionalHeaderProps {
  stationCount?: number;
  recordCount?: number;
  lastUpdated?: string;
  stationData?: StationData[];
  onInfoClick?: () => void;
}

export default function ProfessionalHeader({ 
  stationCount = 0, 
  recordCount = 0, 
  lastUpdated,
  stationData = [],
  onInfoClick 
}: ProfessionalHeaderProps) {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between">
          {/* Main Title Section */}
          <div className="card-professional-glass pointer-events-auto animate-professional-fade-in">
            <div className="flex items-center gap-4">
              <div className="kpi-card-icon gradient-professional-primary">
                <Map className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-professional-display text-gradient-professional">
                  WebGIS Platform
                </h1>
                <p className="text-professional-body mt-2">
                  Interactive Environmental Data Visualization
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant="secondary" className="status-professional status-professional-info">
                    <Activity className="w-3 h-3 mr-1" />
                    Live Data
                  </Badge>
                  {stationCount > 0 && (
                    <Badge variant="outline" className="status-professional">
                      <Map className="w-3 h-3 mr-1" />
                      {stationCount} Stations
                    </Badge>
                  )}
                  {recordCount > 0 && (
                    <Badge variant="outline" className="status-professional">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {recordCount.toLocaleString()} Records
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={onInfoClick}
              className="btn-professional btn-professional-ghost glass-professional"
            >
              <Info className="w-4 h-4 mr-2" />
              About
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="btn-professional btn-professional-ghost glass-professional"
              onClick={() => window.open('https://github.com/eluisluzquadros/climate-eye-forecasting-now', '_blank')}
            >
              <Github className="w-4 h-4 mr-2" />
              Source
            </Button>
          </div>
        </div>

        {/* Storyline Section */}
        {stationData && stationData.length > 0 && (
          <div className="mt-6 card-professional-glass pointer-events-auto animate-professional-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start gap-4">
              <div className="kpi-card-icon bg-gradient-to-br from-blue-100 to-blue-200">
                <AlertTriangle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-professional-subheading">Data Insights</h3>
                <p className="text-professional-body">
                  This visualization displays pollution monitoring data from {stationCount} environmental stations. 
                  The dual-bar markers show pollution levels (A & B) with color-coded severity indicators. 
                  Use the heatmap to identify pollution density patterns and the interactive controls to customize your analysis.
                </p>
                {lastUpdated && (
                  <p className="text-professional-caption mt-2">
                    Last updated: {new Date(lastUpdated).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}