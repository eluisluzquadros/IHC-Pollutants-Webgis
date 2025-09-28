import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

export type StationFilters = {
  stationQuery: string;
  dateFrom?: string | null; // ISO yyyy-mm-dd
  dateTo?: string | null; // ISO yyyy-mm-dd
  polAMin?: number;
  polBMin?: number;
};

interface DataFilterPanelProps {
  value?: StationFilters;
  onChange?: (next: StationFilters) => void;
  className?: string;
}

// Default export per project convention
export default function DataFilterPanel({
  value,
  onChange,
  className = "",
}: DataFilterPanelProps) {
  // Local controlled-uncontrolled hybrid state
  const [stationQuery, setStationQuery] = useState<string>(value?.stationQuery ?? "");
  const [dateFrom, setDateFrom] = useState<string | undefined | null>(value?.dateFrom ?? "");
  const [dateTo, setDateTo] = useState<string | undefined | null>(value?.dateTo ?? "");
  const [polAMin, setPolAMin] = useState<number>(value?.polAMin ?? 0);
  const [polBMin, setPolBMin] = useState<number>(value?.polBMin ?? 0);

  // keep external value in sync if it changes
  useEffect(() => {
    if (!value) return;
    setStationQuery(value.stationQuery ?? "");
    setDateFrom(value.dateFrom ?? "");
    setDateTo(value.dateTo ?? "");
    setPolAMin(value.polAMin ?? 0);
    setPolBMin(value.polBMin ?? 0);
  }, [value?.stationQuery, value?.dateFrom, value?.dateTo, value?.polAMin, value?.polBMin]);

  const currentFilters: StationFilters = useMemo(
    () => ({
      stationQuery,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      polAMin,
      polBMin,
    }),
    [stationQuery, dateFrom, dateTo, polAMin, polBMin]
  );

  const applyFilters = () => {
    onChange?.(currentFilters);
    // Also emit a custom event so other parts (e.g., MapContainer) can subscribe without prop drilling
    window.dispatchEvent(new CustomEvent("station-filters-change", { detail: currentFilters }));
  };

  const resetFilters = () => {
    const cleared: StationFilters = {
      stationQuery: "",
      dateFrom: null,
      dateTo: null,
      polAMin: 0,
      polBMin: 0,
    };
    setStationQuery("");
    setDateFrom("");
    setDateTo("");
    setPolAMin(0);
    setPolBMin(0);
    onChange?.(cleared);
    window.dispatchEvent(new CustomEvent("station-filters-change", { detail: cleared }));
  };

  return (
    <Card className={`bg-white dark:bg-[hsl(var(--card))] text-sm w-full max-w-md ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="stationQuery">Station name</Label>
          <Input
            id="stationQuery"
            placeholder="Search by station name..."
            value={stationQuery}
            onChange={(e) => setStationQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="dateFrom">Date from</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom ?? ""}
              onChange={(e) => setDateFrom(e.target.value || "")}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="dateTo">Date to</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo ?? ""}
              onChange={(e) => setDateTo(e.target.value || "")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="polA">pol_a minimum</Label>
            <span className="text-xs text-muted-foreground">{polAMin}</span>
          </div>
          <Slider
            id="polA"
            value={[polAMin]}
            min={0}
            max={500}
            step={1}
            onValueChange={(v) => setPolAMin(v[0] ?? 0)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="polB">pol_b minimum</Label>
            <span className="text-xs text-muted-foreground">{polBMin}</span>
          </div>
          <Slider
            id="polB"
            value={[polBMin]}
            min={0}
            max={500}
            step={1}
            onValueChange={(v) => setPolBMin(v[0] ?? 0)}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button type="button" className="shrink-0" onClick={applyFilters}>
            Apply
          </Button>
          <Button type="button" variant="secondary" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
