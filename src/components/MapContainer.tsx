import React, { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Card } from "./ui/card";
import StationTooltip from "./StationTooltip";
import Legend from "./Legend";

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

// Function to create marker element from SVG
const createMarkerElement = (polA: number, polB: number, unit: string) => {
  const el = document.createElement("div");
  el.innerHTML = createStationMarkerSVG(polA, polB, unit);
  el.style.cursor = "pointer";
  return el;
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
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const boundsRef = useRef<maplibregl.LngLatBounds | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    position: { x: 0, y: 0 },
    station: null,
  });

  // Safe padding for fitBounds to respect overlays (header/sidebar/legend)
  const getSafePadding = useCallback((): maplibregl.PaddingOptions => {
    const isDesktop =
      typeof window !== "undefined" && window.innerWidth >= 1024;
    const isTablet =
      typeof window !== "undefined" &&
      window.innerWidth >= 768 &&
      window.innerWidth < 1024;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    if (isMobile) {
      return { top: 60, left: 16, right: 16, bottom: 120 }; // More space for mobile controls
    } else if (isTablet) {
      return { top: 70, left: 32, right: 32, bottom: 100 }; // Tablet spacing
    } else {
      return { top: 80, left: 460, right: 16, bottom: 90 }; // Desktop with sidebar
    }
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

  // Debug: Log when stationData changes
  useEffect(() => {
    console.log(
      "MapContainer received stationData:",
      stationData.length,
      "records",
    );
    if (stationData.length > 0) {
      console.log("First station:", stationData[0]);
    }
  }, [stationData]);

  // Initialize map when component mounts
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    const tilesURL =
      (import.meta as any).env?.VITE_BASEMAP_URL ||
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

    if (mapContainer.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: [tilesURL],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [
            {
              id: "osm",
              type: "raster",
              source: "osm",
            },
          ],
        },
        center: [-43.0, -22.9], // Default center on Brazil
        zoom: 6,
        attributionControl: true,
      });

      // Add navigation controls
      map.current.addControl(
        new maplibregl.NavigationControl(),
        "bottom-right",
      );
      map.current.addControl(
        new maplibregl.FullscreenControl(),
        "bottom-right",
      );

      // Set map as loaded when it's ready
      map.current.on("load", () => {
        console.log("Map loaded successfully");
        setMapLoaded(true);
      });

      // Add error handling
      map.current.on("error", (e) => {
        console.error("Map error:", e);
      });
    }

    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      // remove global helper
      // @ts-ignore
      if (window.resetMapView) delete (window as any).resetMapView;
    };
  }, []);

  // Clear existing markers
  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  };

  // Add or update data sources and layers when data or settings change
  useEffect(() => {
    console.log("Data effect triggered:", {
      mapLoaded,
      hasMap: !!map.current,
      dataLength: stationData.length,
    });

    if (!mapLoaded || !map.current) {
      console.log("Map not ready yet");
      return;
    }

    // Clear existing markers
    clearMarkers();

    if (stationData.length === 0) {
      console.log("No station data available");
      // Remove existing heatmap source if no data
      const sourceId = "stations-heatmap-data";
      if (map.current.getSource(sourceId)) {
        if (map.current.getLayer("stations-heatmap")) {
          map.current.removeLayer("stations-heatmap");
        }
        map.current.removeSource(sourceId);
      }
      // Remove clustering source/layers if present
      if (map.current.getSource("stations-cluster-data")) {
        if (map.current.getLayer("cluster-count"))
          map.current.removeLayer("cluster-count");
        if (map.current.getLayer("clusters"))
          map.current.removeLayer("clusters");
        map.current.removeSource("stations-cluster-data");
      }
      return;
    }

    console.log("Processing station data for map...");

    // Filter out stations with null/undefined coordinates
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
      console.log("No valid station data after filtering");
      return;
    }

    // Create custom SVG markers for each station (skip when clustering enabled)
    if (showStationMarkers && !enableClustering) {
      validStations.forEach((station) => {
        const markerElement = createMarkerElement(
          station.pol_a,
          station.pol_b,
          station.unit,
        );

        // Add hover event listeners to the marker element
        markerElement.addEventListener("mouseenter", (event) => {
          handleStationHover(event as any, station);
        });

        markerElement.addEventListener("mouseleave", () => {
          handleStationLeave();
        });

        // Add mousemove event to update tooltip position while hovering
        markerElement.addEventListener("mousemove", (event) => {
          const rect = mapContainer.current?.getBoundingClientRect();
          if (!rect) return;

          setTooltip((prev) => ({
            ...prev,
            position: {
              x: (event as any).clientX - rect.left,
              y: (event as any).clientY - rect.top,
            },
          }));
        });

        const marker = new maplibregl.Marker({
          element: markerElement,
          anchor: "center",
        })
          .setLngLat([station.lon, station.lat])
          .addTo(map.current!);

        // Add popup on click
        const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
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
          `);

        marker.setPopup(popup);
        markersRef.current.push(marker);
      });
    }

    // Create GeoJSON data for heatmap & clustering using valid stations only
    const geojsonData = {
      type: "FeatureCollection",
      features: validStations.map((station) => ({
        type: "Feature",
        properties: {
          id: station.station_id,
          name: station.station_name,
          sample_dt: station.sample_dt,
          pol_a: station.pol_a,
          pol_b: station.pol_b,
          unit: station.unit,
        },
        geometry: {
          type: "Point",
          coordinates: [station.lon, station.lat],
        },
      })),
    } as GeoJSON.FeatureCollection;

    console.log(
      "Created GeoJSON with",
      (geojsonData as any).features.length,
      "features",
    );

    // Add or update the heatmap data source
    const heatSourceId = "stations-heatmap-data";
    if (map.current.getSource(heatSourceId)) {
      console.log("Updating existing heatmap data source");
      (map.current.getSource(heatSourceId) as maplibregl.GeoJSONSource).setData(
        geojsonData as any,
      );
    } else {
      console.log("Adding new heatmap data source and layer");
      map.current.addSource(heatSourceId, {
        type: "geojson",
        data: geojsonData as any,
      });

      map.current.addLayer({
        id: "stations-heatmap",
        type: "heatmap",
        source: heatSourceId,
        paint: {
          "heatmap-weight": [
            "*",
            ["+", ["get", "pol_a"], ["get", "pol_b"]],
            0.1,
          ],
          "heatmap-intensity": 1,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(247,251,255,0)",
            0.2,
            "rgba(231,76,60,0.3)",
            0.5,
            "rgba(231,76,60,0.6)",
            1,
            "rgba(231,76,60,1)",
          ],
          "heatmap-radius": heatmapRadius,
          "heatmap-opacity": heatmapOpacity,
        },
      });
    }

    // Update heatmap layer visibility and props
    if (map.current.getLayer("stations-heatmap")) {
      map.current.setLayoutProperty(
        "stations-heatmap",
        "visibility",
        showHeatmap ? "visible" : "none",
      );
      map.current.setPaintProperty(
        "stations-heatmap",
        "heatmap-radius",
        heatmapRadius,
      );
      map.current.setPaintProperty(
        "stations-heatmap",
        "heatmap-opacity",
        heatmapOpacity,
      );
    }

    // Add or update clustering source and layers
    if (map.current.getSource("stations-cluster-data")) {
      (
        map.current.getSource(
          "stations-cluster-data",
        ) as maplibregl.GeoJSONSource
      ).setData(geojsonData as any);
    } else {
      map.current.addSource("stations-cluster-data", {
        type: "geojson",
        data: geojsonData as any,
        cluster: true,
        clusterRadius: 45,
        clusterMaxZoom: 14,
        // accumulate sums to compute averages in paint expressions
        clusterProperties: {
          sumA: ["+", ["accumulated"], ["get", "pol_a"]],
          sumB: ["+", ["accumulated"], ["get", "pol_b"]],
          count: ["+", ["accumulated"], 1],
        } as any,
      });

      // clusters (circles)
      map.current.addLayer({
        id: "clusters",
        type: "circle",
        source: "stations-cluster-data",
        filter: ["has", "point_count"],
        paint: {
          // average of A and B -> thresholds like markers
          "circle-color": [
            "step",
            [
              "/",
              ["+", ["get", "sumA"], ["get", "sumB"]],
              ["*", 2, ["get", "count"]],
            ],
            "#2ECC71", // <3 low
            3,
            "#F39C12", // 3-7 medium
            7,
            "#E74C3C", // >7 high
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            16,
            50,
            22,
            100,
            28,
            500,
            36,
          ],
          "circle-opacity": 0.85,
          "circle-stroke-color": "#2C3E50",
          "circle-stroke-width": 1,
        },
      });

      // cluster count labels
      map.current.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "stations-cluster-data",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#2C3E50",
          "text-halo-width": 0.75,
        },
      });

      // interactions for clusters
      map.current.on("click", "clusters", (e: any) => {
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        const clusterId = features[0]?.properties?.cluster_id;
        if (clusterId == null) return;
        (
          map.current!.getSource("stations-cluster-data") as any
        ).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
          if (err) return;
          map.current!.easeTo({
            center: (features[0] as any).geometry.coordinates,
            zoom,
          });
        });
      });
      map.current.on("mouseenter", "clusters", () => {
        map.current!.getCanvas().style.cursor = "pointer";
      });
      map.current.on("mouseleave", "clusters", () => {
        map.current!.getCanvas().style.cursor = "";
      });
    }

    // Toggle cluster layers visibility based on enableClustering
    ["clusters", "cluster-count"].forEach((layerId) => {
      if (map.current!.getLayer(layerId)) {
        map.current!.setLayoutProperty(
          layerId,
          "visibility",
          enableClustering ? "visible" : "none",
        );
      }
    });

    // Fit map to show all valid stations
    if (validStations.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      validStations.forEach((station) => {
        bounds.extend([station.lon, station.lat]);
      });
      boundsRef.current = bounds;
      setTimeout(() => {
        if (map.current && boundsRef.current) {
          map.current.fitBounds(boundsRef.current, {
            padding: getSafePadding(),
            maxZoom: 10,
          });
        }
      }, 100);
    }
  }, [
    mapLoaded,
    stationData,
    showStationMarkers,
    showHeatmap,
    heatmapOpacity,
    heatmapRadius,
    enableClustering,
    handleStationHover,
    handleStationLeave,
    getSafePadding,
  ]);

  // Update marker visibility when toggles change
  useEffect(() => {
    markersRef.current.forEach((marker) => {
      if (!enableClustering && showStationMarkers) {
        marker.getElement().style.display = "block";
      } else {
        marker.getElement().style.display = "none";
      }
    });

    // Also toggle cluster layers when the setting changes (for immediate responsiveness)
    if (map.current) {
      ["clusters", "cluster-count"].forEach((layerId) => {
        if (map.current!.getLayer(layerId)) {
          map.current!.setLayoutProperty(
            layerId,
            "visibility",
            enableClustering ? "visible" : "none",
          );
        }
      });
    }
  }, [showStationMarkers, enableClustering]);

  // Expose a resetMapView helper globally for the LayerControlPanel reset button
  useEffect(() => {
    // @ts-ignore
    (window as any).resetMapView = () => {
      if (map.current && boundsRef.current) {
        map.current.fitBounds(boundsRef.current, {
          padding: getSafePadding(),
          maxZoom: 10,
        });
      }
    };
  }, [mapLoaded, getSafePadding]);

  return (
    <Card className="w-full h-full bg-[#2C3E50] overflow-hidden rounded-lg shadow-lg relative">
      <div ref={mapContainer} className="w-full h-full" />
      {/* Legend Component */}
      <Legend />
      {/* Station Tooltip */}
      {tooltip.visible && tooltip.station && (
        <StationTooltip
          station={tooltip.station}
          position={tooltip.position}
          visible={tooltip.visible}
        />
      )}
      {/* Debug info (dev only) */}
      {import.meta.env.DEV && stationData.length > 0 && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs p-2 rounded">
          ✓ {stationData.length} records |{" "}
          {new Set(stationData.map((d) => d.station_id)).size} stations
        </div>
      )}
      {/* Loading indicator */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#2C3E50]">
          <div className="text-white text-lg flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Loading map...
          </div>
        </div>
      )}
    </Card>
  );
};

export default MapContainer;