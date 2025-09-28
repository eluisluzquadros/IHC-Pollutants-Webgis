import React from "react";
import { Card } from "./ui/card";
import { MapPin } from "lucide-react";

interface MapContainerProps {
  stationData?: Array<{
    station_id: string;
    station_name: string;
    lat: number;
    lon: number;
    sample_dt: string;
    pol_a: number;
    pol_b: number;
    unit: string;
  }>;
  showStationMarkers?: boolean;
  showHeatmap?: boolean;
  heatmapOpacity?: number;
  heatmapRadius?: number;
  enableClustering?: boolean;
}

const MapContainer = ({
  stationData = [],
  showStationMarkers = true,
  showHeatmap = true,
  heatmapOpacity = 0.7,
  heatmapRadius = 25,
  enableClustering = false,
}: MapContainerProps) => {
  
  // Temporary placeholder until MapLibre integration is fixed
  return (
    <Card className="w-full h-full bg-[#2C3E50] overflow-hidden rounded-lg shadow-lg relative">
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#2C3E50] to-[#34495E] text-white">
        <div className="text-center p-8">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-blue-400" />
          <h3 className="text-xl font-semibold mb-2">WebGIS Map Component</h3>
          <p className="text-gray-300 mb-4">Interactive environmental data visualization</p>
          <div className="bg-black/20 rounded-lg p-4 max-w-md">
            <p className="text-sm text-gray-200">
              Station Data: <span className="font-semibold text-blue-400">{stationData.length}</span> records
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>Stations: {showStationMarkers ? 'ON' : 'OFF'}</div>
              <div>Heatmap: {showHeatmap ? 'ON' : 'OFF'}</div>
              <div>Clustering: {enableClustering ? 'ON' : 'OFF'}</div>
              <div>Opacity: {Math.round(heatmapOpacity * 100)}%</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MapContainer;