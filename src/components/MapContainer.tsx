import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "./ui/card";
import { MapPin, Loader2 } from "lucide-react";

// Import Leaflet with proper ES6 syntax
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Fix for default Leaflet markers in bundlers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.divIcon({
  html: `<svg width="25" height="41" viewBox="0 0 25 41" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z" fill="#3B82F6"/>
    <circle cx="12.5" cy="12.5" r="4" fill="white"/>
  </svg>`,
  className: 'custom-div-icon',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

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

interface TooltipState {
  visible: boolean;
  position: { x: number; y: number };
  station: {
    id: string;
    name: string;
    lat: number;
    lon: number;
    pol_a: number;
    pol_b: number;
    date?: string;
  } | null;
}

// Function to create custom SVG marker with dual bar chart
const createStationMarkerSVG = (polA: number, polB: number, unit: string) => {
  const maxValue = Math.max(polA, polB, 10); // Ensure minimum scale
  const barHeight = 30;
  const barWidth = 8;
  const spacing = 2;
  const totalWidth = barWidth * 2 + spacing + 4; // 4px padding
  const totalHeight = barHeight + 10; // 10px padding

  // Calculate bar heights (normalized to maxValue)
  const barAHeight = Math.max((polA / maxValue) * barHeight, 2);
  const barBHeight = Math.max((polB / maxValue) * barHeight, 2);

  // Color coding based on pollution levels
  const getBarColor = (value: number) => {
    if (value < 3) return "#2ECC71"; // Green - low pollution
    if (value < 7) return "#F39C12"; // Orange - medium pollution
    return "#E74C3C"; // Red - high pollution
  };

  const colorA = getBarColor(polA);
  const colorB = getBarColor(polB);

  return `
    <svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background circle -->
      <circle cx="${totalWidth / 2}" cy="${totalHeight / 2}" r="${Math.max(totalWidth, totalHeight) / 2 - 1}" 
              fill="rgba(255,255,255,0.9)" stroke="#2C3E50" stroke-width="1"/>
      
      <!-- Bar A (pol_a) -->
      <rect x="2" y="${totalHeight - barAHeight - 5}" 
            width="${barWidth}" height="${barAHeight}" 
            fill="${colorA}" stroke="#2C3E50" stroke-width="0.5"/>
      
      <!-- Bar B (pol_b) -->
      <rect x="${2 + barWidth + spacing}" y="${totalHeight - barBHeight - 5}" 
            width="${barWidth}" height="${barBHeight}" 
            fill="${colorB}" stroke="#2C3E50" stroke-width="0.5"/>
      
      <!-- Labels -->
      <text x="6" y="${totalHeight - 1}" font-family="Arial" font-size="6" fill="#2C3E50" text-anchor="middle">A</text>
      <text x="${6 + barWidth + spacing}" y="${totalHeight - 1}" font-family="Arial" font-size="6" fill="#2C3E50" text-anchor="middle">B</text>
    </svg>
  `;
};

// Function to create custom Leaflet icon from SVG
const createStationIcon = (polA: number, polB: number, unit: string) => {
  return L.divIcon({
    html: createStationMarkerSVG(polA, polB, unit),
    className: 'custom-station-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

const MapContainer = ({
  stationData = [],
  showStationMarkers = true,
  showHeatmap = true,
  heatmapOpacity = 0.7,
  heatmapRadius = 25,
  enableClustering = false,
}: MapContainerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const heatmapLayerRef = useRef<any>(null);
  const clusterGroupRef = useRef<any>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    position: { x: 0, y: 0 },
    station: null,
  });

  // Initialize map when component mounts
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    try {
      // Create the map
      map.current = L.map(mapContainer.current, {
        center: [-22.9, -43.0], // Center on Brazil
        zoom: 6,
        zoomControl: true,
        attributionControl: true,
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map.current);

      // Initialize marker cluster group
      clusterGroupRef.current = (L as any).markerClusterGroup({
        disableClusteringAtZoom: 12,
        maxClusterRadius: 45,
      });

      console.log('Leaflet map loaded successfully');
      setMapLoaded(true);
    } catch (error) {
      console.error('Failed to initialize Leaflet map:', error);
      setMapError('Failed to initialize map');
    }

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      markersRef.current = [];
      heatmapLayerRef.current = null;
      clusterGroupRef.current = null;
    };
  }, []);

  // Handle station hover
  const handleStationHover = useCallback((event: MouseEvent, station: any) => {
    const rect = mapContainer.current?.getBoundingClientRect();
    if (!rect) return;

    setTooltip({
      visible: true,
      position: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      },
      station: {
        id: station.station_id,
        name: station.station_name,
        lat: station.lat,
        lon: station.lon,
        pol_a: station.pol_a,
        pol_b: station.pol_b,
        date: station.sample_dt,
      },
    });
  }, []);

  // Handle station leave
  const handleStationLeave = useCallback(() => {
    setTooltip({
      visible: false,
      position: { x: 0, y: 0 },
      station: null,
    });
  }, []);

  // Clear existing markers and layers
  const clearMapLayers = useCallback(() => {
    if (!map.current) return;

    // Clear markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Clear heatmap
    if (heatmapLayerRef.current) {
      map.current.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }

    // Clear cluster group
    if (clusterGroupRef.current) {
      map.current.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current.clearLayers();
    }
  }, []);

  // Update map data when stationData or settings change
  useEffect(() => {
    if (!mapLoaded || !map.current || !clusterGroupRef.current) return;

    console.log('Processing station data for Leaflet map:', stationData.length, 'records');

    // Clear existing layers
    clearMapLayers();

    if (stationData.length === 0) {
      console.log('No station data available');
      return;
    }

    // Filter valid stations
    const validStations = stationData.filter(station => 
      station.lat != null && 
      station.lon != null && 
      !isNaN(station.lat) && 
      !isNaN(station.lon) &&
      station.pol_a != null &&
      station.pol_b != null &&
      !isNaN(station.pol_a) &&
      !isNaN(station.pol_b)
    );

    console.log(`Filtered ${stationData.length} stations to ${validStations.length} valid stations`);

    if (validStations.length === 0) {
      console.log('No valid station data after filtering');
      return;
    }

    // Create station markers
    if (showStationMarkers) {
      validStations.forEach(station => {
        const marker = L.marker([station.lat, station.lon], {
          icon: createStationIcon(station.pol_a, station.pol_b, station.unit)
        });

        // Add popup
        const popupContent = `
          <div style="color: #2C3E50; font-family: Arial, sans-serif; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #E74C3C;">${station.station_name}</h3>
            <p style="margin: 2px 0;"><strong>Station ID:</strong> ${station.station_id}</p>
            <p style="margin: 2px 0;"><strong>Date:</strong> ${station.sample_dt}</p>
            <div style="display: flex; gap: 15px; margin: 8px 0;">
              <div style="text-align: center;">
                <div style="width: 20px; height: ${Math.max((station.pol_a / Math.max(station.pol_a, station.pol_b, 10)) * 30, 2)}px; 
                            background: ${station.pol_a < 3 ? "#2ECC71" : station.pol_a < 7 ? "#F39C12" : "#E74C3C"}; 
                            margin: 0 auto 4px;"></div>
                <small><strong>Pol A:</strong><br>${station.pol_a} ${station.unit}</small>
              </div>
              <div style="text-align: center;">
                <div style="width: 20px; height: ${Math.max((station.pol_b / Math.max(station.pol_a, station.pol_b, 10)) * 30, 2)}px; 
                            background: ${station.pol_b < 3 ? "#2ECC71" : station.pol_b < 7 ? "#F39C12" : "#E74C3C"}; 
                            margin: 0 auto 4px;"></div>
                <small><strong>Pol B:</strong><br>${station.pol_b} ${station.unit}</small>
              </div>
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; font-size: 11px; color: #666;">
              <div style="display: flex; gap: 10px;">
                <span style="color: #2ECC71;">● Low (&lt;3)</span>
                <span style="color: #F39C12;">● Medium (3-7)</span>
                <span style="color: #E74C3C;">● High (&gt;7)</span>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        markersRef.current.push(marker);

        // Add to cluster group or directly to map
        if (enableClustering) {
          clusterGroupRef.current!.addLayer(marker);
        } else {
          marker.addTo(map.current!);
        }
      });

      // Add cluster group to map if clustering is enabled
      if (enableClustering) {
        map.current.addLayer(clusterGroupRef.current);
      }
    }

    // Create heatmap layer
    if (showHeatmap && (L as any).heatLayer) {
      const heatPoints = validStations.map(station => [
        station.lat,
        station.lon,
        (station.pol_a + station.pol_b) / 2 // Average pollution as intensity
      ]);

      heatmapLayerRef.current = (L as any).heatLayer(heatPoints, {
        radius: heatmapRadius,
        opacity: heatmapOpacity,
        maxZoom: 17,
        gradient: {
          0.4: '#2ECC71',
          0.65: '#F39C12', 
          1.0: '#E74C3C'
        }
      }).addTo(map.current);
    }

    // Fit map to show all stations
    if (validStations.length > 0) {
      const group = new L.FeatureGroup(markersRef.current);
      if (group.getBounds().isValid()) {
        map.current.fitBounds(group.getBounds(), { padding: [20, 20] });
      }
    }

  }, [mapLoaded, stationData, showStationMarkers, showHeatmap, heatmapOpacity, heatmapRadius, enableClustering, clearMapLayers]);

  // Update layer visibility when toggles change
  useEffect(() => {
    if (!map.current || !mapLoaded || stationData.length === 0) return;

    // Clear all markers from map and cluster first
    markersRef.current.forEach(marker => marker.remove());
    if (clusterGroupRef.current) {
      map.current.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current.clearLayers();
    }

    // Re-add markers based on current settings
    if (showStationMarkers && markersRef.current.length > 0) {
      markersRef.current.forEach(marker => {
        if (enableClustering) {
          clusterGroupRef.current?.addLayer(marker);
        } else {
          marker.addTo(map.current!);
        }
      });

      // Add cluster group to map if clustering is enabled
      if (enableClustering && clusterGroupRef.current) {
        map.current.addLayer(clusterGroupRef.current);
      }
    }

    // Toggle heatmap
    if (heatmapLayerRef.current) {
      if (showHeatmap) {
        heatmapLayerRef.current.setOptions({
          radius: heatmapRadius,
          opacity: heatmapOpacity,
        });
        if (!map.current.hasLayer(heatmapLayerRef.current)) {
          map.current.addLayer(heatmapLayerRef.current);
        }
      } else {
        if (map.current.hasLayer(heatmapLayerRef.current)) {
          map.current.removeLayer(heatmapLayerRef.current);
        }
      }
    }
  }, [showStationMarkers, showHeatmap, heatmapOpacity, heatmapRadius, enableClustering, mapLoaded]);

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
          ✓ {stationData.length} records | {new Set(stationData.map((d) => d.station_id)).size} stations
        </div>
      )}
    </Card>
  );
};

export default MapContainer;