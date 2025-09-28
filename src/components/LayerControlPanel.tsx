import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Layers, Droplets, RefreshCw, Download, Users } from "lucide-react";

interface LayerControlPanelProps {
  onToggleStationMarkers?: (enabled: boolean) => void;
  onToggleHeatmap?: (enabled: boolean) => void;
  onHeatmapOpacityChange?: (value: number) => void;
  onHeatmapRadiusChange?: (value: number) => void;
  onToggleClustering?: (enabled: boolean) => void;
  onExportData?: () => void;
  onResetView?: () => void;
  // New: control positioning so it can be used inline in the sidebar or as a floating overlay
  variant?: 'inline' | 'floating';
}

const LayerControlPanel = ({
  onToggleStationMarkers = () => {},
  onToggleHeatmap = () => {},
  onHeatmapOpacityChange = () => {},
  onHeatmapRadiusChange = () => {},
  onToggleClustering = () => {},
  onExportData = () => {},
  onResetView = () => {},
  variant = 'inline',
}: LayerControlPanelProps) => {
  const [stationMarkersEnabled, setStationMarkersEnabled] = useState(true);
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState(70);
  const [heatmapRadius, setHeatmapRadius] = useState(25);
  const [clusteringEnabled, setClusteringEnabled] = useState(false);

  const handleStationMarkersToggle = (checked: boolean) => {
    setStationMarkersEnabled(checked);
    onToggleStationMarkers(checked);
  };

  const handleHeatmapToggle = (checked: boolean) => {
    setHeatmapEnabled(checked);
    onToggleHeatmap(checked);
  };

  const handleHeatmapOpacityChange = (value: number[]) => {
    const opacity = value[0];
    setHeatmapOpacity(opacity);
    onHeatmapOpacityChange(opacity / 100);
  };

  const handleHeatmapRadiusChange = (value: number[]) => {
    const radius = value[0];
    setHeatmapRadius(radius);
    onHeatmapRadiusChange(radius);
  };

  const handleClusteringToggle = (checked: boolean) => {
    setClusteringEnabled(checked);
    onToggleClustering(checked);
  };

  return (
    <Card
      className={
        variant === 'floating'
          ? "w-80 absolute top-4 right-4 bg-white/90 shadow-md z-10 border-none"
          : "w-full bg-white shadow-sm"
      }
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold flex items-center">
            <Layers className="h-5 w-5 mr-2 text-[#3498DB]" />
            Layer Controls
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetView}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Reset View</span>
          </Button>
        </div>

        <Separator className="my-3" />

        <div className="space-y-4">
          {/* Station Markers Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="station-markers" className="text-sm font-medium">
                Station Markers
              </Label>
              <p className="text-xs text-muted-foreground">
                Show pollution level indicators
              </p>
            </div>
            <Switch
              id="station-markers"
              checked={stationMarkersEnabled}
              onCheckedChange={handleStationMarkersToggle}
            />
          </div>

          {/* Heatmap Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="heatmap" className="text-sm font-medium">
                Pollution Heatmap
              </Label>
              <p className="text-xs text-muted-foreground">
                Show pollution density
              </p>
            </div>
            <Switch
              id="heatmap"
              checked={heatmapEnabled}
              onCheckedChange={handleHeatmapToggle}
            />
          </div>

          {/* Heatmap Settings */}
          {heatmapEnabled && (
            <div className="space-y-3 pl-4 border-l-2 border-[#3498DB]/30">
              {/* Opacity Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="opacity-slider" className="text-sm">
                    Opacity
                  </Label>
                  <span className="text-xs font-medium">{heatmapOpacity}%</span>
                </div>
                <Slider
                  id="opacity-slider"
                  min={0}
                  max={100}
                  step={1}
                  value={[heatmapOpacity]}
                  onValueChange={handleHeatmapOpacityChange}
                  className="w-full"
                />
              </div>

              {/* Radius Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="radius-slider" className="text-sm">
                    Radius
                  </Label>
                  <span className="text-xs font-medium">{heatmapRadius}px</span>
                </div>
                <Slider
                  id="radius-slider"
                  min={5}
                  max={50}
                  step={1}
                  value={[heatmapRadius]}
                  onValueChange={handleHeatmapRadiusChange}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <Separator className="my-1" />

          {/* Advanced Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Advanced Features</h4>

            {/* Clustering Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-[#3498DB]" />
                <Label htmlFor="clustering" className="text-sm">
                  Station Clustering
                </Label>
              </div>
              <Switch
                id="clustering"
                checked={clusteringEnabled}
                onCheckedChange={handleClusteringToggle}
              />
            </div>

            {/* Export Data Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onExportData}
              className="w-full flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LayerControlPanel;