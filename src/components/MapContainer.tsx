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
  enableStationClustering?: boolean;
  enableRecordClustering?: boolean;
  showRecordCount?: boolean;
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

// Station-based clustering: Groups stations by geographical proximity
const createStationClusters = (stations: any[], zoomLevel: number) => {
  const baseRadius = 0.1; // Base radius in degrees
  const zoomFactor = Math.max(1, 18 - zoomLevel);
  const clusterRadius = baseRadius * (zoomFactor / 10);
  
  console.log(`Station clustering at zoom ${zoomLevel} with radius ${clusterRadius.toFixed(4)}`);
  
  const groups: any[][] = [];
  const processed = new Set<number>();
  
  for (let i = 0; i < stations.length; i++) {
    if (processed.has(i)) continue;
    
    const group = [stations[i]];
    const queue = [i];
    processed.add(i);
    
    while (queue.length > 0) {
      const currentIndex = queue.shift()!;
      const currentStation = stations[currentIndex];
      
      for (let j = 0; j < stations.length; j++) {
        if (processed.has(j)) continue;
        
        const distance = Math.sqrt(
          Math.pow(currentStation.lat - stations[j].lat, 2) +
          Math.pow(currentStation.lon - stations[j].lon, 2)
        );
        
        if (distance <= clusterRadius) {
          group.push(stations[j]);
          queue.push(j);
          processed.add(j);
        }
      }
    }
    
    groups.push(group);
  }
  
  return groups;
};

// Record-based clustering: Groups all records from same station
const createRecordClusters = (stations: any[]) => {
  const stationGroups = new Map<string, any[]>();
  
  stations.forEach(station => {
    const key = `${station.station_id}-${station.station_name}`;
    if (!stationGroups.has(key)) {
      stationGroups.set(key, []);
    }
    stationGroups.get(key)!.push(station);
  });
  
  const groups = Array.from(stationGroups.values());
  console.log(`Record clustering: ${groups.length} station groups from ${stations.length} records`);
  
  return groups;
};

// Create cluster marker with dynamic styling based on density
const createClusterMarker = (stationGroup: any[], lat: number, lon: number) => {
  const stationCount = stationGroup.length;
  const totalReadings = stationGroup.reduce((sum, station) => sum + 1, 0); // Assuming 1 reading per station
  
  // Dynamic size based on station count
  let size = 30;
  let bgColor = '#3B82F6';
  let textColor = 'white';
  
  if (stationCount >= 20) {
    size = 60;
    bgColor = '#DC2626'; // Red for high density
  } else if (stationCount >= 10) {
    size = 50;
    bgColor = '#EA580C'; // Orange for medium density
  } else if (stationCount >= 5) {
    size = 40;
    bgColor = '#D97706'; // Yellow-orange for low-medium density
  }
  
  const clusterIcon = L.divIcon({
    html: `<div style="
             background: ${bgColor}; 
             color: ${textColor}; 
             border-radius: 50%; 
             width: ${size}px; 
             height: ${size}px; 
             display: flex; 
             align-items: center; 
             justify-content: center; 
             font-weight: bold; 
             font-size: ${Math.max(10, size / 4)}px;
             border: 3px solid white; 
             box-shadow: 0 2px 6px rgba(0,0,0,0.4);
             cursor: pointer;
           ">
             ${stationCount}
           </div>`,
    className: 'dynamic-cluster-marker',
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
  
  return L.marker([lat, lon], { icon: clusterIcon });
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
}: MapContainerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(6);
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
      
      // Add zoom event listener for dynamic clustering
      map.current.on('zoomend', () => {
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
    if (!mapLoaded || !map.current || !heatmapLayerRef.current || !clusterGroupRef.current) return;

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

    // 1. CREATE REAL HEATMAP WITH LARGE AREA INTERPOLATION
    if (showHeatmap) {
      console.log('Creating large-area heatmap with', validStations.length, 'stations');
      
      // Calculate pollution values and normalize
      const pollutionValues = validStations.map(s => (s.pol_a + s.pol_b) / 2);
      const maxPollution = Math.max(...pollutionValues, 1);
      
      // Create heatmap data points
      const heatmapData = validStations.map(station => {
        const avgPollution = (station.pol_a + station.pol_b) / 2;
        const intensity = Math.min(avgPollution / maxPollution, 1);
        
        return {
          lat: station.lat,
          lng: station.lon,
          intensity: intensity,
          pollution: avgPollution
        };
      });
      
      // Create large overlapping circles for true heatmap effect
      heatmapData.forEach(point => {
        // Much larger base radius for wide area coverage like reference image
        const baseRadiusKm = (heatmapRadius / 10) + 20; // 20-25km base for 50px radius
        const intensityRadius = baseRadiusKm * (0.8 + point.intensity * 2); // Scale with intensity
        
        // Color based on pollution level
        let color = '#10B981'; // Green for low
        if (point.pollution >= 7) {
          color = '#EF4444'; // Red for high
        } else if (point.pollution >= 4) {
          color = '#F59E0B'; // Orange for medium-high
        } else if (point.pollution >= 2) {
          color = '#FCD34D'; // Yellow for medium
        }
        
        // Create large overlapping circles for wide area coverage
        for (let i = 0; i < 3; i++) {
          const radiusMultiplier = (3 - i) / 3; // 1.0, 0.67, 0.33
          const currentRadiusKm = intensityRadius * radiusMultiplier;
          const currentRadiusMeters = currentRadiusKm * 1000; // Convert km to meters
          
          // Higher opacity for better visibility
          const baseOpacity = Math.max(heatmapOpacity * 0.6, 0.4); // Ensure minimum visibility
          const opacityStep = baseOpacity * (1 - i * 0.3) * Math.max(point.intensity, 0.3);
          
          const heatCircle = L.circle([point.lat, point.lng], {
            radius: Math.max(currentRadiusMeters, 8000), // Minimum 8km radius for visibility
            fillColor: color,
            color: color,
            weight: 0,
            opacity: 0,
            fillOpacity: Math.max(opacityStep, 0.15), // Higher minimum opacity
            interactive: false
          });
          
          heatmapLayerRef.current!.addLayer(heatCircle);
        }
      });
      
      console.log(`Large-area heatmap created: radius ${heatmapRadius}px -> ${(heatmapRadius / 10) + 20}km base coverage, opacity ${heatmapOpacity}`);
      map.current.addLayer(heatmapLayerRef.current);
    }

    // 2. CREATE RECORD COUNT MARKERS (INDEPENDENT FEATURE)
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
    
    // 3. CREATE CLUSTERING AND MARKERS (TWO SEPARATE OPTIONS)
    const enableAnyClustering = enableStationClustering || enableRecordClustering;
    
    if (showStationMarkers || enableAnyClustering) {
      let clusteredStations: any[][] = [];
      
      // Handle both clustering types - they can work simultaneously
      if (enableStationClustering && enableRecordClustering) {
        // Both types active: First group by station (records), then by geography
        const recordGroups = createRecordClusters(validStations);
        // Flatten back to individual stations for geographical clustering
        const flatStations = recordGroups.flatMap(group => group);
        clusteredStations = createStationClusters(flatStations, currentZoom);
        console.log(`Combined clustering: ${recordGroups.length} record groups -> ${clusteredStations.length} geographical groups`);
      } else if (enableStationClustering) {
        // Station-based clustering only: geographical proximity
        clusteredStations = createStationClusters(validStations, currentZoom);
        console.log(`Station clustering: ${clusteredStations.length} geographical groups`);
      } else if (enableRecordClustering) {
        // Record-based clustering only: same station, multiple records
        clusteredStations = createRecordClusters(validStations);
        console.log(`Record clustering: ${clusteredStations.length} station groups`);
      } else {
        // No clustering - each station in its own group
        clusteredStations = validStations.map(station => [station]);
        console.log(`Individual markers: ${clusteredStations.length} stations`);
      }

      clusteredStations.forEach((stationGroup, groupIndex) => {
        if (enableAnyClustering && stationGroup.length > 1) {
          // Multiple stations - create dynamic cluster marker
          const centerLat = stationGroup.reduce((sum, s) => sum + s.lat, 0) / stationGroup.length;
          const centerLon = stationGroup.reduce((sum, s) => sum + s.lon, 0) / stationGroup.length;
          const avgPolA = stationGroup.reduce((sum, s) => sum + s.pol_a, 0) / stationGroup.length;
          const avgPolB = stationGroup.reduce((sum, s) => sum + s.pol_b, 0) / stationGroup.length;
          
          const clusterMarker = createClusterMarker(stationGroup, centerLat, centerLon);
          
          // Enhanced cluster popup - different content based on clustering type
          let clusterType = 'Cluster';
          let clusterDescription = `${stationGroup.length} items`;
          
          if (enableStationClustering && enableRecordClustering) {
            clusterType = 'Combined Cluster';
            clusterDescription = `${stationGroup.length} stations/records with combined grouping`;
          } else if (enableStationClustering) {
            clusterType = 'Station Cluster';
            clusterDescription = `Geographical cluster of ${stationGroup.length} nearby stations`;
          } else if (enableRecordClustering) {
            clusterType = 'Record Cluster';
            clusterDescription = `${stationGroup.length} readings from same station location`;
          }
          
          const clusterPopupContent = `
            <div style="color: #2C3E50; font-family: Arial, sans-serif; max-width: 350px;">
              <h3 style="margin: 0 0 8px 0; color: #DC2626;">${clusterType}: ${stationGroup.length} ${enableStationClustering ? 'Stations' : 'Records'}</h3>
              <p style="margin: 2px 0; font-size: 11px; color: #666;">${clusterDescription}</p>
              <p style="margin: 6px 0 2px 0;"><strong>Average Pollution Levels:</strong></p>
              <div style="display: flex; gap: 15px; margin: 8px 0;">
                <div style="text-align: center;">
                  <div style="width: 24px; height: ${Math.max((avgPolA / Math.max(avgPolA, avgPolB, 10)) * 30, 2)}px; 
                              background: ${avgPolA < 3 ? "#2ECC71" : avgPolA < 7 ? "#F39C12" : "#E74C3C"}; 
                              margin: 0 auto 4px; border: 1px solid #ccc;"></div>
                  <small><strong>Pol A:</strong><br>${avgPolA.toFixed(2)}</small>
                </div>
                <div style="text-align: center;">
                  <div style="width: 24px; height: ${Math.max((avgPolB / Math.max(avgPolA, avgPolB, 10)) * 30, 2)}px; 
                              background: ${avgPolB < 3 ? "#2ECC71" : avgPolB < 7 ? "#F39C12" : "#E74C3C"}; 
                              margin: 0 auto 4px; border: 1px solid #ccc;"></div>
                  <small><strong>Pol B:</strong><br>${avgPolB.toFixed(2)}</small>
                </div>
              </div>
              <hr style="margin: 8px 0; border: none; border-top: 1px solid #eee;">
              <p style="margin: 4px 0; font-size: 11px; color: #666;"><strong>Stations in this cluster:</strong></p>
              <div style="max-height: 150px; overflow-y: auto; font-size: 11px;">
                ${stationGroup.map((station, idx) => 
                  `<div style="margin: 2px 0; padding: 3px 6px; background: ${idx % 2 === 0 ? '#f8f9fa' : '#ffffff'}; border-radius: 3px; border-left: 3px solid ${(station.pol_a + station.pol_b) / 2 < 3 ? '#2ECC71' : (station.pol_a + station.pol_b) / 2 < 7 ? '#F39C12' : '#E74C3C'};">
                     <strong>${station.station_name}</strong><br>
                     <span style="color: #666;">Pol A: ${station.pol_a} | Pol B: ${station.pol_b} | ${station.sample_dt}</span>
                   </div>`
                ).join('')}
              </div>
              <div style="margin-top: 8px; font-size: 10px; color: #999; text-align: center;">
                Zoom in for individual stations
              </div>
            </div>
          `;
          
          clusterMarker.bindPopup(clusterPopupContent);
          markersRef.current.push(clusterMarker);
          clusterMarker.addTo(map.current!);
        } else if (showStationMarkers) {
          // Single station - create individual marker
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

          // Individual station popup
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
        }
      });
    }

    // 3. FIT MAP TO SHOW ALL STATIONS
    if (validStations.length > 0) {
      const group = new L.FeatureGroup(markersRef.current);
      if (group.getBounds().isValid()) {
        map.current.fitBounds(group.getBounds(), { padding: [20, 20] });
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