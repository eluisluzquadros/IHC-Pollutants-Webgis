import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "./ui/card";
import { MapPin, Loader2 } from "lucide-react";

// Import Leaflet with proper ES6 syntax
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Note: Heat and cluster plugins may not work in Vite environment
// We'll implement alternative solutions

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

// Function to group stations by distance for manual clustering
const groupStationsByDistance = (stations: any[], threshold: number) => {
  const groups: any[][] = [];
  const processed = new Set<number>();
  
  for (let i = 0; i < stations.length; i++) {
    if (processed.has(i)) continue;
    
    const group = [stations[i]];
    processed.add(i);
    
    // Find nearby stations
    for (let j = i + 1; j < stations.length; j++) {
      if (processed.has(j)) continue;
      
      const distance = Math.sqrt(
        Math.pow(stations[i].lat - stations[j].lat, 2) +
        Math.pow(stations[i].lon - stations[j].lon, 2)
      );
      
      if (distance <= threshold) {
        group.push(stations[j]);
        processed.add(j);
      }
    }
    
    groups.push(group);
  }
  
  return groups;
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
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const clusterGroupRef = useRef<L.LayerGroup | null>(null);
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

      // Initialize custom cluster group
      clusterGroupRef.current = L.layerGroup();
      
      // Initialize heatmap layer group
      heatmapLayerRef.current = L.layerGroup();

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

    // Clear heatmap layer group
    if (heatmapLayerRef.current) {
      map.current.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current.clearLayers();
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

    // Implement manual clustering
    const clusteredStations = enableClustering ? 
      groupStationsByDistance(validStations, 0.01) : // 0.01 degree (~1km) clustering threshold
      validStations.map(station => [station]); // Each station in its own group

    // Create station markers
    if (showStationMarkers) {
      clusteredStations.forEach((stationGroup, groupIndex) => {
        if (stationGroup.length === 1) {
          // Single station - create normal marker
          const station = stationGroup[0];
          const marker = L.marker([station.lat, station.lon], {
            icon: createStationIcon(station.pol_a, station.pol_b, station.unit)
          });

          // Connect tooltip events after marker is added to DOM
          marker.on('add', () => {
            const markerElement = marker.getElement();
            if (markerElement) {
              markerElement.addEventListener('mouseenter', (e) => handleStationHover(e as MouseEvent, station));
              markerElement.addEventListener('mouseleave', handleStationLeave);
            }
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
          marker.addTo(map.current!);
          
        } else {
          // Multiple stations - create cluster marker
          const centerLat = stationGroup.reduce((sum, s) => sum + s.lat, 0) / stationGroup.length;
          const centerLon = stationGroup.reduce((sum, s) => sum + s.lon, 0) / stationGroup.length;
          const avgPolA = stationGroup.reduce((sum, s) => sum + s.pol_a, 0) / stationGroup.length;
          const avgPolB = stationGroup.reduce((sum, s) => sum + s.pol_b, 0) / stationGroup.length;
          
          const clusterIcon = L.divIcon({
            html: `<div style="background: #3B82F6; color: white; border-radius: 50%; width: 40px; height: 40px; 
                           display: flex; align-items: center; justify-content: center; font-weight: bold; 
                           border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                     ${stationGroup.length}
                   </div>`,
            className: 'custom-cluster-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });
          
          const clusterMarker = L.marker([centerLat, centerLon], { icon: clusterIcon });
          
          // Cluster popup with all stations
          const clusterPopupContent = `
            <div style="color: #2C3E50; font-family: Arial, sans-serif; max-width: 300px;">
              <h3 style="margin: 0 0 8px 0; color: #3B82F6;">Cluster of ${stationGroup.length} Stations</h3>
              <p style="margin: 2px 0;"><strong>Average Pollution:</strong></p>
              <div style="display: flex; gap: 15px; margin: 8px 0;">
                <div style="text-align: center;">
                  <div style="width: 20px; height: ${Math.max((avgPolA / Math.max(avgPolA, avgPolB, 10)) * 30, 2)}px; 
                              background: ${avgPolA < 3 ? "#2ECC71" : avgPolA < 7 ? "#F39C12" : "#E74C3C"}; 
                              margin: 0 auto 4px;"></div>
                  <small><strong>Avg A:</strong><br>${avgPolA.toFixed(1)}</small>
                </div>
                <div style="text-align: center;">
                  <div style="width: 20px; height: ${Math.max((avgPolB / Math.max(avgPolA, avgPolB, 10)) * 30, 2)}px; 
                              background: ${avgPolB < 3 ? "#2ECC71" : avgPolB < 7 ? "#F39C12" : "#E74C3C"}; 
                              margin: 0 auto 4px;"></div>
                  <small><strong>Avg B:</strong><br>${avgPolB.toFixed(1)}</small>
                </div>
              </div>
              <hr style="margin: 8px 0; border: none; border-top: 1px solid #eee;">
              <div style="max-height: 150px; overflow-y: auto;">
                ${stationGroup.map(station => 
                  `<div style="margin: 4px 0; padding: 4px; background: #f8f9fa; border-radius: 4px;">
                     <strong>${station.station_name}</strong><br>
                     <small>Pol A: ${station.pol_a}, Pol B: ${station.pol_b}</small>
                   </div>`
                ).join('')}
              </div>
            </div>
          `;
          
          clusterMarker.bindPopup(clusterPopupContent);
          markersRef.current.push(clusterMarker);
          clusterMarker.addTo(map.current!);
        }
      });
    }

    // Create alternative heatmap using colored circles
    if (showHeatmap && heatmapLayerRef.current) {
      validStations.forEach(station => {
        const avgPollution = (station.pol_a + station.pol_b) / 2;
        const maxPollution = Math.max(...validStations.map(s => (s.pol_a + s.pol_b) / 2));
        const intensity = avgPollution / maxPollution;
        
        // Calculate radius based on intensity
        const radius = Math.max(heatmapRadius * intensity, 5);
        
        // Color based on pollution level
        const color = avgPollution < 3 ? '#2ECC71' : 
                     avgPollution < 7 ? '#F39C12' : '#E74C3C';
        
        const heatCircle = L.circle([station.lat, station.lon], {
          radius: radius * 20, // Scale for visibility
          fillColor: color,
          color: color,
          weight: 1,
          opacity: heatmapOpacity,
          fillOpacity: heatmapOpacity * 0.6
        });
        
        heatmapLayerRef.current!.addLayer(heatCircle);
      });
      
      map.current.addLayer(heatmapLayerRef.current);
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
        // Clear and recreate heatmap with new settings
        heatmapLayerRef.current.clearLayers();
        
        // Recreate heatmap circles with updated settings
        const validStations = stationData.filter(station => 
          station.lat != null && station.lon != null && 
          !isNaN(station.lat) && !isNaN(station.lon) &&
          station.pol_a != null && station.pol_b != null &&
          !isNaN(station.pol_a) && !isNaN(station.pol_b)
        );
        
        validStations.forEach(station => {
          const avgPollution = (station.pol_a + station.pol_b) / 2;
          const maxPollution = Math.max(...validStations.map(s => (s.pol_a + s.pol_b) / 2));
          const intensity = avgPollution / maxPollution;
          
          const radius = Math.max(heatmapRadius * intensity, 5);
          const color = avgPollution < 3 ? '#2ECC71' : 
                       avgPollution < 7 ? '#F39C12' : '#E74C3C';
          
          const heatCircle = L.circle([station.lat, station.lon], {
            radius: radius * 20,
            fillColor: color,
            color: color,
            weight: 1,
            opacity: heatmapOpacity,
            fillOpacity: heatmapOpacity * 0.6
          });
          
          heatmapLayerRef.current!.addLayer(heatCircle);
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
      
      {/* Custom Tooltip */}
      {tooltip.visible && tooltip.station && (
        <div 
          className="absolute bg-white border border-gray-300 rounded-lg shadow-lg p-3 pointer-events-none z-[1000]"
          style={{
            left: tooltip.position.x + 10,
            top: tooltip.position.y - 10,
            maxWidth: '250px',
            fontSize: '12px'
          }}
        >
          <div className="text-[#2C3E50]">
            <h4 className="font-semibold text-sm mb-1 text-[#E74C3C]">{tooltip.station.name}</h4>
            <p className="mb-1"><strong>ID:</strong> {tooltip.station.id}</p>
            {tooltip.station.date && (
              <p className="mb-2"><strong>Date:</strong> {tooltip.station.date}</p>
            )}
            <div className="flex gap-3 mb-2">
              <div className="text-center">
                <div 
                  className="w-4 h-6 mx-auto mb-1"
                  style={{
                    backgroundColor: tooltip.station.pol_a < 3 ? '#2ECC71' : 
                                   tooltip.station.pol_a < 7 ? '#F39C12' : '#E74C3C',
                    height: `${Math.max((tooltip.station.pol_a / Math.max(tooltip.station.pol_a, tooltip.station.pol_b, 10)) * 24, 2)}px`
                  }}
                />
                <small><strong>Pol A:</strong><br/>{tooltip.station.pol_a}</small>
              </div>
              <div className="text-center">
                <div 
                  className="w-4 h-6 mx-auto mb-1"
                  style={{
                    backgroundColor: tooltip.station.pol_b < 3 ? '#2ECC71' : 
                                   tooltip.station.pol_b < 7 ? '#F39C12' : '#E74C3C',
                    height: `${Math.max((tooltip.station.pol_b / Math.max(tooltip.station.pol_a, tooltip.station.pol_b, 10)) * 24, 2)}px`
                  }}
                />
                <small><strong>Pol B:</strong><br/>{tooltip.station.pol_b}</small>
              </div>
            </div>
            <div className="text-xs text-gray-600 border-t pt-1">
              <span className="text-[#2ECC71] mr-2">● Low (&lt;3)</span>
              <span className="text-[#F39C12] mr-2">● Med (3-7)</span>
              <span className="text-[#E74C3C]">● High (&gt;7)</span>
            </div>
          </div>
        </div>
      )}
      
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