import React from "react";
import { Card, CardContent } from "./ui/card";

interface StationTooltipProps {
  // New consolidated prop (preferred)
  station?: {
    name?: string;
    sampleDate?: string;
    polA?: number;
    polB?: number;
    unit?: string;
  };
  // Backward-compatible individual props
  stationName?: string;
  sampleDate?: string;
  polA?: number;
  polB?: number;
  unit?: string;
  visible?: boolean;
  // Position is optional: if provided, tooltip will be absolutely positioned
  position?: { x: number; y: number };
}

const StationTooltip: React.FC<StationTooltipProps> = ({
  station,
  stationName = "Station Name",
  sampleDate = "2023-01-01",
  polA = 5.5,
  polB = 3.2,
  unit = "mg/L",
  visible = true,
  position,
}) => {
  if (!visible) return null;

  const name = station?.name ?? stationName;
  const date = station?.sampleDate ?? sampleDate;
  const a = station?.polA ?? polA;
  const b = station?.polB ?? polB;
  const u = station?.unit ?? unit;

  const content = (
    <Card className="bg-background/90 backdrop-blur-sm border shadow-lg w-[250px]">
      <CardContent className="p-4">
        <h3 className="font-semibold text-base mb-1">{name}</h3>
        <p className="text-xs text-muted-foreground mb-3">{date}</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF6B6B]"></div>
              <span className="text-sm">Pollutant A</span>
            </div>
            <span className="font-medium text-sm">
              {a} {u}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#4ECDC4]"></div>
              <span className="text-sm">Pollutant B</span>
            </div>
            <span className="font-medium text-sm">
              {b} {u}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // If position provided, render absolutely positioned tooltip (map hover case)
  if (position) {
    return (
      <div
        className="absolute z-50 pointer-events-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translate(-50%, -100%) translateY(-10px)",
        }}
      >
        {content}
      </div>
    );
  }

  // Otherwise render inline (e.g., when parent handles positioning)
  return <div className="relative z-10">{content}</div>;
};

export default StationTooltip;