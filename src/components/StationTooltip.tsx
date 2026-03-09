import React from "react";
import { Card } from "./ui/card";
import { MapPin, Activity } from "lucide-react";

interface StationTooltipProps {
  station: {
    id: string;
    name: string;
    lat: number;
    lon: number;
    pol_a: number;
    pol_b: number;
    date?: string;
  } | null;
  maxPolA: number;
  maxPolB: number;
  visiblePollutants?: string[];
}

export default function StationTooltip({
  station,
  maxPolA,
  maxPolB,
  visiblePollutants = ["pol_a", "pol_b"]
}: StationTooltipProps) {
  if (!station) return null;

  const polA = station.pol_a ?? 0;
  const polB = station.pol_b ?? 0;
  const lat = station.lat ?? 0;
  const lon = station.lon ?? 0;

  const getPollutionStatus = (value: number, max: number) => {
    const percentage = (value / (max || 1)) * 100;
    if (percentage > 75) {
      return { status: 'HIGH', color: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20' };
    } else if (percentage > 50) {
      return { status: 'MEDIUM', color: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20' };
    } else {
      return { status: 'LOW', color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20' };
    }
  };

  const polAStatus = getPollutionStatus(polA, maxPolA);
  const polBStatus = getPollutionStatus(polB, maxPolB);

  return (
    <Card className="bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl p-4 min-w-[280px] max-w-[320px] dark:bg-gray-900/95 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <MapPin className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm truncate dark:text-white">
            {station.name || 'Unknown Station'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ID: {station.id || 'N/A'}
          </p>
        </div>
      </div>

      {/* Location */}
      <div className="mb-3 p-2 bg-gray-50 rounded-lg dark:bg-gray-800">
        <p className="text-xs text-gray-600 dark:text-gray-300">
          <span className="font-medium">Coordinates:</span> {lat.toFixed(4)}, {lon.toFixed(4)}
        </p>
        {station.date && (
          <p className="text-xs text-gray-600 mt-1 dark:text-gray-300">
            <span className="font-medium">Last Update:</span> {station.date}
          </p>
        )}
      </div>

      {/* Pollution Details */}
      <div className="space-y-4 pt-1">
        {visiblePollutants.includes("pol_a") && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <Activity className="w-3.5 h-3.5" />
                <span>Pollution A</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{polA.toFixed(2)}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${polAStatus.color}`}>
                  {polAStatus.status}
                </span>
              </div>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(Math.max((polA / (maxPolA || 1)) * 100, 0), 100)}%` }}
              />
            </div>
          </div>
        )}

        {visiblePollutants.includes("pol_b") && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 dark:text-purple-400">
                <Activity className="w-3.5 h-3.5" />
                <span>Pollution B</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{polB.toFixed(2)}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${polBStatus.color}`}>
                  {polBStatus.status}
                </span>
              </div>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-200/50 dark:border-gray-700/50">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(Math.max((polB / (maxPolB || 1)) * 100, 0), 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}