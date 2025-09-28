import React from "react";
import { Card } from "./ui/card";
import { MapPin, Activity, TrendingUp } from "lucide-react";

interface StationData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  pol_a: number;
  pol_b: number;
  date?: string;
}

interface StationTooltipProps {
  station: StationData;
  position: { x: number; y: number };
  visible: boolean;
}

const StationTooltip: React.FC<StationTooltipProps> = ({ 
  station, 
  position, 
  visible 
}) => {
  if (!visible || !station) return null;

  // Add safety checks for undefined/null values
  const polA = station.pol_a ?? 0;
  const polB = station.pol_b ?? 0;
  const lat = station.lat ?? 0;
  const lon = station.lon ?? 0;

  // Calculate pollution levels for visual indicators
  const polALevel = polA > 75 ? 'high' : polA > 50 ? 'medium' : 'low';
  const polBLevel = polB > 75 ? 'high' : polB > 50 ? 'medium' : 'low';

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div
      className="fixed z-[1000] pointer-events-none"
      style={{
        left: `${position.x + 10}px`,
        top: `${position.y - 10}px`,
        transform: 'translateY(-100%)'
      }}
    >
      <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl p-4 min-w-[280px] max-w-[320px]">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {station.name || 'Unknown Station'}
            </h3>
            <p className="text-xs text-gray-500">
              ID: {station.id || 'N/A'}
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="mb-3 p-2 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Coordinates:</span> {lat.toFixed(4)}, {lon.toFixed(4)}
          </p>
          {station.date && (
            <p className="text-xs text-gray-600 mt-1">
              <span className="font-medium">Last Update:</span> {station.date}
            </p>
          )}
        </div>

        {/* Pollution Data */}
        <div className="space-y-3">
          {/* Pollution A */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Pollution A</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">
                {polA.toFixed(1)}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getLevelColor(polALevel)}`}>
                {polALevel.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Pollution B */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">Pollution B</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">
                {polB.toFixed(1)}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getLevelColor(polBLevel)}`}>
                {polBLevel.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Visual Bars */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Pol A</span>
                  <span>{polA.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      polALevel === 'high' ? 'bg-red-500' : 
                      polALevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(Math.max(polA, 0), 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Pol B</span>
                  <span>{polB.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      polBLevel === 'high' ? 'bg-red-500' : 
                      polBLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(Math.max(polB, 0), 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StationTooltip;