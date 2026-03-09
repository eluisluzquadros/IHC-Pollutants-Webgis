import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

const Legend = () => {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <Card className="absolute bottom-24 left-4 z-50 bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200 rounded-xl">
      <CardContent className="p-4 relative">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm text-[#2C3E50]">Legend</h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            aria-label={collapsed ? "Expand legend" : "Collapse legend"}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>

        {!collapsed && (
          <div>
            {/* Station Markers Section */}
            <div className="mb-4">
              <h5 className="text-xs font-medium mb-2 text-gray-700">Station Pollution Levels</h5>
              <div className="space-y-1">
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full bg-[#2ECC71] mr-2 border border-gray-300"></div>
                  <span>Low (&lt; 3 units)</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full bg-[#F39C12] mr-2 border border-gray-300"></div>
                  <span>Medium (3-7 units)</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="w-3 h-3 rounded-full bg-[#E74C3C] mr-2 border border-gray-300"></div>
                  <span>High (&gt; 7 units)</span>
                </div>
              </div>
            </div>

            {/* Station Marker Example */}
            <div className="mb-4">
              <h5 className="text-xs font-medium mb-2 text-gray-700">Station Markers</h5>
              <div className="flex items-center text-xs">
                <div className="mr-2 flex items-end">
                  <div className="w-2 h-4 bg-[#2ECC71] mr-0.5 border border-gray-400"></div>
                  <div className="w-2 h-6 bg-[#E74C3C] border border-gray-400"></div>
                </div>
                <span>Dual bars (Pol A | Pol B)</span>
              </div>
            </div>

            {/* Heatmap Section */}
            <div>
              <h5 className="text-xs font-medium mb-2 text-gray-700">Heatmap Intensity</h5>
              <div className="flex items-center text-xs">
                <div className="w-8 h-3 bg-gradient-to-r from-transparent via-[#E74C3C]/50 to-[#E74C3C] mr-2 border border-gray-300 rounded-sm"></div>
                <span>Low → High</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Legend;