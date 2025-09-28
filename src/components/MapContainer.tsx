import React, { useEffect, useRef, useState } from "react";
import { Card } from "./ui/card";
import { MapPin, Loader2 } from "lucide-react";

// Import MapLibre GL JS with proper ES6 syntax
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize map when component mounts
  useEffect(() => {
    if (map.current) return;

    try {
      if (mapContainer.current) {
        map.current = new maplibregl.Map({
          container: mapContainer.current,
          style: {
            version: 8,
            sources: {
              osm: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap contributors'
              }
            },
            layers: [
              {
                id: 'osm',
                type: 'raster',
                source: 'osm'
              }
            ]
          },
          center: [-43.0, -22.9], // Default center on Brazil
          zoom: 6,
          attributionControl: { compact: false }
        });

        // Add navigation controls
        map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
        map.current.addControl(new maplibregl.FullscreenControl(), 'bottom-right');

        // Set map as loaded when it's ready
        map.current.on('load', () => {
          console.log('Map loaded successfully');
          setMapLoaded(true);
        });

        // Add error handling
        map.current.on('error', (e: any) => {
          console.error('Map error:', e);
          setMapError('Failed to load map');
        });
      }
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError('Failed to initialize map');
    }

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);


  // If there's a map error, show error state
  if (mapError) {
    return (
      <Card className="w-full h-full bg-[#2C3E50] overflow-hidden rounded-lg shadow-lg relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#2C3E50] to-[#34495E] text-white">
          <div className="text-center p-8">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h3 className="text-xl font-semibold mb-2">Map Error</h3>
            <p className="text-gray-300 mb-4">{mapError}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full bg-[#2C3E50] overflow-hidden rounded-lg shadow-lg relative">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#2C3E50]">
          <div className="text-white text-lg flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            Loading map...
          </div>
        </div>
      )}
      
      {/* Debug info (dev only) */}
      {import.meta.env.DEV && stationData.length > 0 && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs p-2 rounded">
          ✓ {stationData.length} records
        </div>
      )}
    </Card>
  );
};

export default MapContainer;