import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Map, 
  Activity, 
  TrendingUp, 
  Info,
  Github,
  Upload,
  Download,
  RotateCcw,
  Bot,
  Menu
} from 'lucide-react';
import { StationData } from '@/utils/csvImporter';

interface AppBarProps {
  stationCount?: number;
  recordCount?: number;
  lastUpdated?: string;
  stationData?: StationData[];
  onInfoClick?: () => void;
  onUploadClick?: () => void;
  onExportClick?: () => void;
  onResetView?: () => void;
  onAIAssistantClick?: () => void;
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export default function AppBar({ 
  stationCount = 0, 
  recordCount = 0, 
  lastUpdated,
  stationData = [],
  onInfoClick,
  onUploadClick,
  onExportClick,
  onResetView,
  onAIAssistantClick,
  onMenuToggle,
  isMobileMenuOpen = false
}: AppBarProps) {
  return (
    <header className="h-16 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-500 shadow-lg z-40">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Brand Section */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Map className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">WebGIS Platform</h1>
              <p className="text-xs text-blue-100 opacity-90">Environmental Data Visualization</p>
            </div>
          </div>
        </div>

        {/* Metrics Section */}
        <div className="flex items-center gap-4">
          {stationCount > 0 && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-white">
                <Activity className="w-4 h-4 text-blue-200" />
                <div className="text-right">
                  <div className="text-lg font-bold leading-none">{stationCount}</div>
                  <div className="text-xs text-blue-200">Stations</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white">
                <TrendingUp className="w-4 h-4 text-blue-200" />
                <div className="text-right">
                  <div className="text-lg font-bold leading-none">{recordCount.toLocaleString()}</div>
                  <div className="text-xs text-blue-200">Records</div>
                </div>
              </div>
            </div>
          )}
          
          <Badge variant="secondary" className="bg-green-500/20 text-green-100 border-green-400/30">
            <Activity className="w-3 h-3 mr-1" />
            Live Data
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuToggle}
            className="md:hidden text-white hover:bg-white/20"
            title="Toggle Menu"
          >
            <Menu className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onAIAssistantClick}
            className="text-white hover:bg-white/20 border border-white/30 hidden sm:flex"
            title="AI Assistant"
          >
            <Bot className="w-4 h-4 mr-2" />
            <span className="hidden lg:inline">AI Assistant</span>
            <Bot className="lg:hidden w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-white/30 mx-1 hidden sm:block" />
          
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onUploadClick}
              className="text-white hover:bg-white/20"
              title="Import Data"
            >
              <Upload className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onExportClick}
              className="text-white hover:bg-white/20"
              title="Export Data"
            >
              <Download className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetView}
              className="text-white hover:bg-white/20"
              title="Reset Map View"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="w-px h-6 bg-white/30 mx-1 hidden lg:block" />
          
          <div className="hidden lg:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onInfoClick}
              className="text-white hover:bg-white/20"
              title="About"
            >
              <Info className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => window.open('https://github.com/eluisluzquadros/IHC-Pollutants-Webgis/', '_blank')}
              title="View Source Code"
            >
              <Github className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}