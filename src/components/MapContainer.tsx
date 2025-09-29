import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "./ui/card";
import { MapPin, Loader2 } from "lucide-react";

// Import Leaflet with proper ES6 syntax
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Import leaflet.heat for proper heatmap interpolation
import 'leaflet.heat';
// Import leaflet.markercluster for proper clustering
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Extend Leaflet interface for heatmap and markercluster
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: {
      radius?: number;
      blur?: number;
      maxZoom?: number;
      max?: number;
      gradient?: { [key: number]: string };
    }
  ): any;
  
  namespace L {
    function markerClusterGroup(options?: any): any;
  }
}

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
  enableStationClustering?: boolean;
  enableRecordClustering?: boolean;
  showRecordCount?: boolean;
  onStationHover?: (station: any, x: number, y: number) => void;
  onStationLeave?: () => void;
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




// Function to group station data by station for record counting
const groupStationsByLocation = (stations: any[]) => {
  const stationGroups = new Map<string, any[]>();
  
  stations.forEach(station => {
    const key = `${station.station_id}-${station.station_name}`;
    if (!stationGroups.has(key)) {
      stationGroups.set(key, []);
    }
    stationGroups.get(key)!.push(station);
  });
  
  return Array.from(stationGroups.values());
};

// Create record count marker with number of readings
const createRecordCountMarker = (stationGroup: any[]) => {
  const station = stationGroup[0]; // Use first record for position and basic info
  const recordCount = stationGroup.length;
  
  // Dynamic size and color based on record count
  let size = 30;
  let bgColor = '#10B981'; // Green for few records
  let borderColor = '#059669';
  
  if (recordCount >= 50) {
    size = 50;
    bgColor = '#DC2626'; // Red for many records
    borderColor = '#B91C1C';
  } else if (recordCount >= 20) {
    size = 42;
    bgColor = '#EA580C'; // Orange for medium records
    borderColor = '#C2410C';
  } else if (recordCount >= 10) {
    size = 36;
    bgColor = '#D97706'; // Yellow for some records
    borderColor = '#B45309';
  }
  
  const recordIcon = L.divIcon({
    html: `<div style="
             background: ${bgColor}; 
             color: white; 
             border: 3px solid ${borderColor};
             border-radius: 8px; 
             width: ${size}px; 
             height: ${size}px; 
             display: flex; 
             flex-direction: column;
             align-items: center; 
             justify-content: center; 
             font-weight: bold; 
             font-size: ${Math.max(9, size / 5)}px;
             box-shadow: 0 2px 6px rgba(0,0,0,0.4);
             cursor: pointer;
             position: relative;
           ">
             <div style="font-size: ${Math.max(8, size / 6)}px; line-height: 1;">REC</div>
             <div style="font-size: ${Math.max(10, size / 4)}px; line-height: 1; font-weight: 900;">${recordCount}</div>
           </div>`,
    className: 'record-count-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
  
  return L.marker([station.lat, station.lon], { icon: recordIcon });
};

const MapContainer = ({
  stationData = [],
  showStationMarkers = true,
  showHeatmap = true,
  heatmapOpacity = 0.7,
  heatmapRadius = 25,
  enableStationClustering = false,
  enableRecordClustering = false,
  showRecordCount = false,
  onStationHover,
  onStationLeave,
}: MapContainerProps) => {
  console.log(`🔍 MapContainer props received:`, {
    onStationHover: !!onStationHover,
    onStationLeave: !!onStationLeave,
    onStationHoverType: typeof onStationHover,
    onStationLeaveType: typeof onStationLeave
  });
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(6);
  const markersRef = useRef<L.Marker[]>([]);
  const heatmapLayerRef = useRef<any>(null);
  const clusterGroupRef = useRef<L.LayerGroup | null>(null);
  const stationClusterGroupRef = useRef<any>(null);
  const recordClusterGroupRef = useRef<any>(null);

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

      // Initialize cluster groups
      clusterGroupRef.current = L.layerGroup();
      
      // Initialize marker cluster groups with custom styling
      stationClusterGroupRef.current = (L as any).markerClusterGroup({
        maxClusterRadius: 80,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        removeOutsideVisibleBounds: true,
        animate: true,
        animateAddingMarkers: false,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          let className = 'marker-cluster-small';
          let size = 40;
          
          if (count < 10) {
            className = 'marker-cluster-small';
            size = 40;
          } else if (count < 100) {
            className = 'marker-cluster-medium';
            size = 50;
          } else {
            className = 'marker-cluster-large';
            size = 60;
          }
          
          return L.divIcon({
            html: `<div><span>${count}</span></div>`,
            className: 'marker-cluster ' + className,
            iconSize: [size, size]
          });
        }
      });
      
      recordClusterGroupRef.current = (L as any).markerClusterGroup({
        maxClusterRadius: 50,
        showCoverageOnHover: true,
        spiderfyOnMaxZoom: true,
        removeOutsideVisibleBounds: true,
        animate: true,
        animateAddingMarkers: false,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: `<div><span>${count}</span></div>`,
            className: 'marker-cluster marker-cluster-records',
            iconSize: [45, 45]
          });
        }
      });
      
      // Add zoom event listener for dynamic clustering - with proper event handling
      map.current.on('zoomend', (e) => {
        const newZoom = map.current!.getZoom();
        console.log('Zoom changed to:', newZoom);
        setCurrentZoom(newZoom);
      });
      
      // Set initial zoom
      setCurrentZoom(map.current.getZoom());

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
      stationClusterGroupRef.current = null;
      recordClusterGroupRef.current = null;
    };
  }, []);


  // Clear existing markers and layers
  const clearMapLayers = useCallback(() => {
    if (!map.current) return;

    // Clear markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Clear heatmap layer
    if (heatmapLayerRef.current) {
      try {
        if (heatmapLayerRef.current instanceof L.LayerGroup) {
          heatmapLayerRef.current.clearLayers();
        }
        map.current.removeLayer(heatmapLayerRef.current);
      } catch (e) {
        // Layer might not be on the map
      }
      heatmapLayerRef.current = null;
    }

    // Clear cluster groups
    if (clusterGroupRef.current) {
      map.current.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current.clearLayers();
    }
    
    if (stationClusterGroupRef.current) {
      map.current.removeLayer(stationClusterGroupRef.current);
      stationClusterGroupRef.current.clearLayers();
    }
    
    if (recordClusterGroupRef.current) {
      map.current.removeLayer(recordClusterGroupRef.current);
      recordClusterGroupRef.current.clearLayers();
    }
  }, []);

  // Update map data when stationData or settings change
  useEffect(() => {
    if (!mapLoaded || !map.current || !clusterGroupRef.current) return;

    console.log('Processing station data for Leaflet map:', stationData.length, 'records');
    console.log('Map settings - showHeatmap:', showHeatmap, 'showStationMarkers:', showStationMarkers, 'showRecordCount:', showRecordCount);
    console.log('Clustering settings - enableStationClustering:', enableStationClustering, 'enableRecordClustering:', enableRecordClustering);

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

    // 1. CREATE HEATMAP WITH COLORED CIRCLES
    if (showHeatmap && heatmapOpacity > 0) {
      console.log('Creating interpolated heatmap with leaflet.heat:', validStations.length, 'stations');
      
      // Calculate pollution values and normalize
      const pollutionValues = validStations.map(s => (s.pol_a + s.pol_b) / 2);
      const maxPollution = Math.max(...pollutionValues, 1);
      
      // Create heatmap data in leaflet.heat format
      const heatmapData = validStations.map(station => {
        const avgPollution = (station.pol_a + station.pol_b) / 2;
        const intensity = Math.min(avgPollution / maxPollution, 1);
        
        // leaflet.heat expects: [lat, lng, intensity]
        return [station.lat, station.lon, intensity];
      });
      
      // Remove existing heatmap layer if present
      if (heatmapLayerRef.current) {
        map.current!.removeLayer(heatmapLayerRef.current);
        heatmapLayerRef.current = null;
      }
      
      // Create real heatmap with interpolation
      console.log('Creating interpolated heatmap with leaflet.heat...');
      
      try {
        // Create heatmap layer with proper interpolation and opacity control
        heatmapLayerRef.current = L.heatLayer(heatmapData as [number, number, number][], {
          radius: heatmapRadius,
          blur: 15,
          maxZoom: 17,
          max: 1.0,
          gradient: {
            0.0: `rgba(0, 255, 0, ${heatmapOpacity})`,      // Verde com opacity
            0.2: `rgba(128, 255, 0, ${heatmapOpacity})`,    // Verde-amarelo
            0.4: `rgba(255, 255, 0, ${heatmapOpacity})`,    // Amarelo
            0.6: `rgba(255, 128, 0, ${heatmapOpacity})`,    // Laranja
            0.8: `rgba(255, 64, 0, ${heatmapOpacity})`,     // Vermelho-laranja
            1.0: `rgba(255, 0, 0, ${heatmapOpacity})`       // Vermelho com opacity
          }
        });
        
        // Add heatmap to map
        heatmapLayerRef.current.addTo(map.current!);
        
        console.log(`✓ Interpolated heatmap created with ${validStations.length} data points, radius: ${heatmapRadius}, opacity: ${heatmapOpacity}`);
      } catch (error) {
        console.error('Error creating interpolated heatmap:', error);
        console.log('Fallback: Using colored circles instead of heatmap interpolation...');
        
        // Fallback to circles if heatmap fails
        validStations.forEach((station, index) => {
          const avgPollution = (station.pol_a + station.pol_b) / 2;
          const intensity = Math.min(avgPollution / maxPollution, 1);
          
          let color = '#00ff00';
          if (intensity > 0.8) color = '#ff0000';
          else if (intensity > 0.6) color = '#ff4500';
          else if (intensity > 0.4) color = '#ffa500';
          else if (intensity > 0.2) color = '#ffff00';
          
          const circle = L.circle([station.lat, station.lon], {
            radius: heatmapRadius * 300,
            fillColor: color,
            fillOpacity: heatmapOpacity * intensity * 0.6,
            weight: 1,
            color: color,
            opacity: 0.2
          });
          
          circle.addTo(map.current!);
          markersRef.current.push(circle as any);
        });
      }
    }

    // 2. CREATE STATION MARKERS (IF ENABLED)
    if (showStationMarkers && !enableStationClustering && !enableRecordClustering) {
      console.log('Creating individual station markers:', validStations.length);
      validStations.forEach(station => {
        const marker = L.marker([station.lat, station.lon], {
          icon: createStationIcon(station.pol_a, station.pol_b, station.unit)
        });
        
        marker.bindPopup(`
          <div style="min-width: 200px;">
            <h3>${station.station_name}</h3>
            <p>Station ID: ${station.station_id}</p>
            <p>Date: ${station.sample_dt}</p>
            <p>Pol A: ${station.pol_a} ${station.unit}</p>
            <p>Pol B: ${station.pol_b} ${station.unit}</p>
          </div>
        `);
        
        markersRef.current.push(marker);
        marker.addTo(map.current!);
      });
    }
    
    // 3. CREATE RECORD COUNT MARKERS (INDEPENDENT FEATURE)
    if (showRecordCount) {
      const stationGroups = groupStationsByLocation(validStations);
      console.log(`Creating record count markers for ${stationGroups.length} unique stations`);
      
      stationGroups.forEach(stationGroup => {
        const station = stationGroup[0];
        const recordCount = stationGroup.length;
        
        const recordMarker = createRecordCountMarker(stationGroup);
        
        // Enhanced popup showing all readings with dates
        const allReadings = stationGroup
          .sort((a, b) => new Date(b.sample_dt).getTime() - new Date(a.sample_dt).getTime())
          .map((reading, idx) => {
            const avgPollution = (reading.pol_a + reading.pol_b) / 2;
            const status = avgPollution < 3 ? 'Low' : avgPollution < 7 ? 'Medium' : 'High';
            const statusColor = avgPollution < 3 ? '#10B981' : avgPollution < 7 ? '#F59E0B' : '#EF4444';
            
            return `<div style="
                       margin: 3px 0; 
                       padding: 6px 8px; 
                       background: ${idx % 2 === 0 ? '#F9FAFB' : '#FFFFFF'}; 
                       border-radius: 4px; 
                       border-left: 3px solid ${statusColor};
                       font-size: 11px;
                     ">
                       <div style="display: flex; justify-content: space-between; align-items: center;">
                         <strong style="color: #374151;">#${idx + 1} - ${reading.sample_dt}</strong>
                         <span style="
                           background: ${statusColor}; 
                           color: white; 
                           padding: 2px 6px; 
                           border-radius: 12px; 
                           font-size: 9px; 
                           font-weight: bold;
                         ">${status}</span>
                       </div>
                       <div style="color: #6B7280; margin-top: 2px;">
                         Pol A: <strong>${reading.pol_a}</strong> | Pol B: <strong>${reading.pol_b}</strong> ${reading.unit}
                       </div>
                     </div>`;
          }).join('');
        
        const recordPopupContent = `
          <div style="color: #1F2937; font-family: Arial, sans-serif; max-width: 400px;">
            <div style="
              background: linear-gradient(135deg, #3B82F6, #1E40AF); 
              color: white; 
              padding: 12px; 
              margin: -8px -8px 12px -8px; 
              border-radius: 8px 8px 0 0;
            ">
              <h3 style="margin: 0 0 4px 0; font-size: 16px;">${station.station_name}</h3>
              <p style="margin: 0; font-size: 12px; opacity: 0.9;">Station ID: ${station.station_id}</p>
            </div>
            
            <div style="
              background: #F3F4F6; 
              padding: 8px 12px; 
              border-radius: 6px; 
              margin-bottom: 12px;
              text-align: center;
            ">
              <div style="font-size: 24px; font-weight: bold; color: #1F2937;">${recordCount}</div>
              <div style="font-size: 12px; color: #6B7280;">Total Records</div>
            </div>
            
            <p style="margin: 8px 0 4px 0; font-weight: bold; color: #374151;">All Readings (Latest First):</p>
            <div style="
              max-height: 200px; 
              overflow-y: auto; 
              border: 1px solid #E5E7EB; 
              border-radius: 6px; 
              padding: 4px;
            ">
              ${allReadings}
            </div>
            
            <div style="
              margin-top: 12px; 
              padding-top: 8px; 
              border-top: 1px solid #E5E7EB; 
              font-size: 10px; 
              color: #9CA3AF;
              text-align: center;
            ">
              💡 This view shows all individual readings for this station location
            </div>
          </div>
        `;
        
        recordMarker.bindPopup(recordPopupContent, { maxWidth: 420 });
        markersRef.current.push(recordMarker);
        recordMarker.addTo(map.current!);
      });
    }
    
    // 3. CREATE MARKERS WITH REAL CLUSTERING USING LEAFLET.MARKERCLUSTER
    console.log(`Creating markers with clustering - Station: ${enableStationClustering}, Record: ${enableRecordClustering}`);
    
    if (showStationMarkers || enableStationClustering || enableRecordClustering) {
      
      if (enableStationClustering) {
        // Station-based clustering: Group unique stations geographically
        console.log('Creating Station Clustering with leaflet.markercluster');
        
        // Get unique stations (deduplicate by station_id + location)
        const uniqueStations = new Map<string, any>();
        validStations.forEach(station => {
          const key = `${station.station_id}-${station.lat}-${station.lon}`;
          if (!uniqueStations.has(key)) {
            uniqueStations.set(key, station);
          }
        });
        
        const stationArray = Array.from(uniqueStations.values());
        console.log(`Station clustering: ${stationArray.length} unique stations`);
        
        // Create markers for each unique station and add to cluster group
        stationArray.forEach(station => {
          const marker = L.marker([station.lat, station.lon], {
            icon: createStationIcon(station.pol_a, station.pol_b, station.unit)
          });
          
          // Station popup
          const stationPopupContent = `
            <div style="color: #2C3E50; font-family: Arial, sans-serif; max-width: 300px;">
              <h3 style="margin: 0 0 8px 0; color: #3B82F6;">${station.station_name || 'Station ' + station.station_id}</h3>
              <p style="margin: 2px 0; font-size: 11px; color: #666;">Station ID: ${station.station_id}</p>
              <p style="margin: 6px 0 2px 0;"><strong>Pollution Levels:</strong></p>
              <div style="display: flex; gap: 15px; margin: 8px 0;">
                <div style="text-align: center;">
                  <div style="width: 24px; height: ${Math.max((station.pol_a / Math.max(station.pol_a, station.pol_b, 10)) * 30, 2)}px; 
                              background: ${station.pol_a < 3 ? "#2ECC71" : station.pol_a < 7 ? "#F39C12" : "#E74C3C"}; 
                              margin: 0 auto 4px; border: 1px solid #ccc;"></div>
                  <small><strong>Pol A:</strong><br>${station.pol_a.toFixed(2)} ${station.unit}</small>
                </div>
                <div style="text-align: center;">
                  <div style="width: 24px; height: ${Math.max((station.pol_b / Math.max(station.pol_a, station.pol_b, 10)) * 30, 2)}px; 
                              background: ${station.pol_b < 3 ? "#2ECC71" : station.pol_b < 7 ? "#F39C12" : "#E74C3C"}; 
                              margin: 0 auto 4px; border: 1px solid #ccc;"></div>
                  <small><strong>Pol B:</strong><br>${station.pol_b.toFixed(2)} ${station.unit}</small>
                </div>
              </div>
              <p style="margin: 8px 0 2px 0; font-size: 10px; color: #888;">
                📍 ${station.lat.toFixed(4)}, ${station.lon.toFixed(4)}
              </p>
              <p style="margin: 2px 0; font-size: 10px; color: #888;">
                📅 ${station.sample_dt || 'No date available'}
              </p>
            </div>
          `;
          
          marker.bindPopup(stationPopupContent);
          stationClusterGroupRef.current.addLayer(marker);
        });
        
        // Add station cluster group to map
        map.current!.addLayer(stationClusterGroupRef.current);
        
      } else if (enableRecordClustering) {
        // Record-based clustering: Group records by station location
        console.log('Creating Record Clustering with leaflet.markercluster');
        
        const stationGroups = new Map<string, any[]>();
        validStations.forEach(station => {
          const key = `${station.station_id}-${station.station_name}`;
          if (!stationGroups.has(key)) {
            stationGroups.set(key, []);
          }
          stationGroups.get(key)!.push(station);
        });
        
        console.log(`Record clustering: ${stationGroups.size} station locations with multiple records`);
        
        // Create markers for each station group
        stationGroups.forEach(stationGroup => {
          const representative = stationGroup[0]; // Use first record for position
          const recordCount = stationGroup.length;
          
          const marker = L.marker([representative.lat, representative.lon], {
            icon: createStationIcon(representative.pol_a, representative.pol_b, representative.unit)
          });
          
          // Record cluster popup with all readings
          const recordsHtml = stationGroup.map((record, idx) => `
            <div style="padding: 4px; margin: 2px 0; background: ${idx % 2 === 0 ? '#f8f9fa' : '#ffffff'}; border-radius: 3px;">
              <small><strong>Reading ${idx + 1}:</strong> Pol A: ${record.pol_a.toFixed(2)}, Pol B: ${record.pol_b.toFixed(2)} ${record.unit}</small>
              <small style="display: block; color: #888; font-size: 9px;">📅 ${record.sample_dt || 'No date'}</small>
            </div>
          `).join('');
          
          const recordPopupContent = `
            <div style="color: #2C3E50; font-family: Arial, sans-serif; max-width: 400px;">
              <h3 style="margin: 0 0 8px 0; color: #10B981;">${representative.station_name || 'Station ' + representative.station_id}</h3>
              <p style="margin: 2px 0; font-size: 11px; color: #666;"><strong>${recordCount} readings</strong> at this location</p>
              <div style="max-height: 200px; overflow-y: auto; margin: 8px 0;">
                ${recordsHtml}
              </div>
              <p style="margin: 8px 0 2px 0; font-size: 10px; color: #888;">
                📍 ${representative.lat.toFixed(4)}, ${representative.lon.toFixed(4)}
              </p>
            </div>
          `;
          
          marker.bindPopup(recordPopupContent);
          recordClusterGroupRef.current.addLayer(marker);
        });
        
        // Add record cluster group to map
        map.current!.addLayer(recordClusterGroupRef.current);
        
      } else if (showStationMarkers) {
        // Individual markers without clustering
        console.log(`Creating ${validStations.length} individual station markers`);
        
        validStations.forEach(station => {
          console.log(`🔍 Creating marker for station ${station.station_id}, callbacks available:`, {
            onStationHover: !!onStationHover,
            onStationLeave: !!onStationLeave
          });
          
          const marker = L.marker([station.lat, station.lon], {
            icon: createStationIcon(station.pol_a, station.pol_b, station.unit)
          });
          
          const stationPopupContent = `
            <div style="color: #2C3E50; font-family: Arial, sans-serif; max-width: 300px;">
              <h3 style="margin: 0 0 8px 0; color: #3B82F6;">${station.station_name || 'Station ' + station.station_id}</h3>
              <p style="margin: 2px 0; font-size: 11px; color: #666;">Station ID: ${station.station_id}</p>
              <p style="margin: 6px 0 2px 0;"><strong>Pollution Levels:</strong></p>
              <div style="display: flex; gap: 15px; margin: 8px 0;">
                <div style="text-align: center;">
                  <div style="width: 24px; height: ${Math.max((station.pol_a / Math.max(station.pol_a, station.pol_b, 10)) * 30, 2)}px; 
                              background: ${station.pol_a < 3 ? "#2ECC71" : station.pol_a < 7 ? "#F39C12" : "#E74C3C"}; 
                              margin: 0 auto 4px; border: 1px solid #ccc;"></div>
                  <small><strong>Pol A:</strong><br>${station.pol_a.toFixed(2)} ${station.unit}</small>
                </div>
                <div style="text-align: center;">
                  <div style="width: 24px; height: ${Math.max((station.pol_b / Math.max(station.pol_a, station.pol_b, 10)) * 30, 2)}px; 
                              background: ${station.pol_b < 3 ? "#2ECC71" : station.pol_b < 7 ? "#F39C12" : "#E74C3C"}; 
                              margin: 0 auto 4px; border: 1px solid #ccc;"></div>
                  <small><strong>Pol B:</strong><br>${station.pol_b.toFixed(2)} ${station.unit}</small>
                </div>
              </div>
              <p style="margin: 8px 0 2px 0; font-size: 10px; color: #888;">
                📍 ${station.lat.toFixed(4)}, ${station.lon.toFixed(4)}
              </p>
              <p style="margin: 2px 0; font-size: 10px; color: #888;">
                📅 ${station.sample_dt || 'No date available'}
              </p>
            </div>
          `;
          
          marker.bindPopup(stationPopupContent);
          
          // Add hover events for external tooltip
          if (onStationHover && onStationLeave) {
            console.log(`✅ Adding hover events to station ${station.station_id}`);
            marker.on('mouseover', (e) => {
              console.log(`🎯 HOVER detected on station ${station.station_id}`);
              const rect = mapContainer.current?.getBoundingClientRect();
              if (rect) {
                const event = e.originalEvent as MouseEvent;
                console.log(`📍 Calling onStationHover with coords:`, event.clientX - rect.left, event.clientY - rect.top);
                onStationHover(station, event.clientX - rect.left, event.clientY - rect.top);
              }
            });
            
            marker.on('mouseout', () => {
              console.log(`👋 MOUSEOUT detected on station ${station.station_id}`);
              onStationLeave();
            });
          } else {
            console.log(`❌ NO callbacks available for station ${station.station_id}`);
          }
          
          markersRef.current.push(marker);
          marker.addTo(map.current!);
        });
      }
    }

    // 4. FIT MAP TO SHOW ALL STATIONS
    if (validStations.length > 0 && markersRef.current.length > 0) {
      const group = new L.FeatureGroup(markersRef.current);
      if (group.getBounds().isValid()) {
        map.current!.fitBounds(group.getBounds(), { padding: [20, 20] });
      }
    }

  }, [mapLoaded, stationData, showStationMarkers, showHeatmap, heatmapOpacity, heatmapRadius, enableStationClustering, enableRecordClustering, showRecordCount, currentZoom, clearMapLayers]);

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