import React, { memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as PieChartComponent, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, BarChart3, Database, PieChart, Zap, CheckCircle, ShieldCheck } from 'lucide-react';

/**
 * Professional Pollution Dashboard Component
 * 
 * Provides comprehensive analytics and visualizations for pollution monitoring data.
 * Features include:
 * - Responsive KPI cards with real-time metrics
 * - Interactive charts with professional styling
 * - Performance-optimized rendering with memoization
 * - Mobile-first responsive design
 * - Accessibility-compliant components
 * 
 * @component
 */

interface StationData {
  station_id: string;
  station_name: string;
  lat: number;
  lon: number;
  sample_dt: string;
  pol_a: number;
  pol_b: number;
  unit: string;
}

interface PollutionDashboardProps {
  /** Array of station data for analysis */
  stationData?: StationData[];
  /** List of pollutants to display */
  visiblePollutants?: string[];
  /** Optional CSS class name */
  className?: string;
  /** Optional pre-calculated analytics (e.g. from DuckDB) */
  externalAnalytics?: AnalyticsData;
  /** Loading state */
  isLoading?: boolean;
}

export interface AnalyticsData {
  totalStations: number;
  avgPolA: number;
  avgPolB: number;
  maxPolA: number;
  maxPolB: number;
  useDualAxis: boolean;
  highPollutionStations: number;
  chartData: any[]; // refined type below
  pollutionLevels: any[];
  trendData: any[];
}

interface PollutionStatus {
  status: string;
  color: string;
  icon: React.ComponentType<any>;
}

// Professional color palette for charts - Dark Mode Optimized
const CHART_COLORS = {
  primary: '#10B981',   // Emerald (Matching Envibase theme)
  secondary: '#3B82F6', // Blue
  success: '#13ec80',   // Envibase Green
  warning: '#F59E0B',   // Amber
  danger: '#EF4444',    // Red
  purple: '#8B5CF6'     // Violet
} as const;

// Pollution level thresholds
const POLLUTION_THRESHOLDS = {
  LOW: 3,
  HIGH: 7
} as const;

const PollutionDashboard: React.FC<PollutionDashboardProps> = memo(({
  stationData = [],
  visiblePollutants = ["pol_a", "pol_b"],
  className = "",
  externalAnalytics,
  isLoading = false
}) => {
  // Memoized analytics calculations for optimal performance
  const analytics = useMemo((): AnalyticsData => {
    if (externalAnalytics) return externalAnalytics;

    if (stationData.length === 0) {
      return {
        totalStations: 0,
        avgPolA: 0,
        avgPolB: 0,
        highPollutionStations: 0,
        chartData: [],
        pollutionLevels: [],
        trendData: [],
        maxPolA: 0,
        maxPolB: 0,
        useDualAxis: false
      };
    }

    const totalStations = new Set(stationData.map(d => d.station_id)).size;
    const avgPolA = stationData.reduce((sum, d) => sum + d.pol_a, 0) / stationData.length;
    const avgPolB = stationData.reduce((sum, d) => sum + d.pol_b, 0) / stationData.length;
    const highPollutionStations = stationData.filter(d =>
      d.pol_a > POLLUTION_THRESHOLDS.HIGH || d.pol_b > POLLUTION_THRESHOLDS.HIGH
    ).length;

    // Optimized chart data for top stations
    const stationAverages = Array.from(new Set(stationData.map(d => d.station_id)))
      .map(stationId => {
        const stationRecords = stationData.filter(d => d.station_id === stationId);
        const avgA = stationRecords.reduce((sum, r) => sum + r.pol_a, 0) / stationRecords.length;
        const avgB = stationRecords.reduce((sum, r) => sum + r.pol_b, 0) / stationRecords.length;
        const stationName = stationRecords[0].station_name;

        return {
          name: stationName.length > 12
            ? `${stationName.substring(0, 12)}...`
            : stationName,
          station: stationName.length > 12
            ? `${stationName.substring(0, 12)}...`
            : stationName,
          pol_a: Number(avgA.toFixed(1)),
          pol_b: Number(avgB.toFixed(1))
        };
      })
      .sort((a, b) => (b.pol_a + b.pol_b) - (a.pol_a + a.pol_b))
      .slice(0, 6);

    // Pollution level distribution with optimized filtering
    const lowCount = stationData.filter(d =>
      d.pol_a < POLLUTION_THRESHOLDS.LOW && d.pol_b < POLLUTION_THRESHOLDS.LOW
    ).length;

    const mediumCount = stationData.filter(d =>
      ((d.pol_a >= POLLUTION_THRESHOLDS.LOW && d.pol_a <= POLLUTION_THRESHOLDS.HIGH) ||
        (d.pol_b >= POLLUTION_THRESHOLDS.LOW && d.pol_b <= POLLUTION_THRESHOLDS.HIGH)) &&
      !(d.pol_a > POLLUTION_THRESHOLDS.HIGH || d.pol_b > POLLUTION_THRESHOLDS.HIGH)
    ).length;

    const highCount = stationData.filter(d =>
      d.pol_a > POLLUTION_THRESHOLDS.HIGH || d.pol_b > POLLUTION_THRESHOLDS.HIGH
    ).length;

    const pollutionLevels = [
      { name: 'Low (< 3)', value: lowCount, color: CHART_COLORS.success },
      { name: 'Medium (3-7)', value: mediumCount, color: CHART_COLORS.warning },
      { name: 'High (> 7)', value: highCount, color: CHART_COLORS.danger }
    ];

    const maxPolA = Math.max(...stationData.map(d => d.pol_a), 0.1);
    const maxPolB = Math.max(...stationData.map(d => d.pol_b), 0.1);

    // Scale detection: if one value is significantly larger than the other
    const scaleRatio = maxPolA / maxPolB;
    const showA = visiblePollutants.includes("pol_a");
    const showB = visiblePollutants.includes("pol_b");
    const useDualAxis = (showA && showB) && (scaleRatio > 5 || scaleRatio < 0.2);

    return {
      totalStations,
      avgPolA: Number(avgPolA.toFixed(2)),
      avgPolB: Number(avgPolB.toFixed(2)),
      maxPolA,
      maxPolB,
      useDualAxis,
      highPollutionStations,
      chartData: stationAverages,
      pollutionLevels,
      trendData: []
    };
  }, [stationData, externalAnalytics, visiblePollutants]);

  // Memoized pollution status calculator
  const getPollutionStatus = useCallback((value: number): PollutionStatus => {
    if (value < POLLUTION_THRESHOLDS.LOW) {
      return {
        status: 'Low',
        color: 'status-professional-success',
        icon: TrendingDown
      };
    }
    if (value <= POLLUTION_THRESHOLDS.HIGH) {
      return {
        status: 'Medium',
        color: 'status-professional-warning',
        icon: Activity
      };
    }
    return {
      status: 'High',
      color: 'status-professional-error',
      icon: AlertTriangle
    };
  }, []);

  // Memoized status calculations
  const polAStatus = useMemo(() => getPollutionStatus(analytics.avgPolA), [analytics.avgPolA, getPollutionStatus]);
  const polBStatus = useMemo(() => getPollutionStatus(analytics.avgPolB), [analytics.avgPolB, getPollutionStatus]);

  // Empty state component
  if (!isLoading && stationData.length === 0 && !externalAnalytics) {
    return (
      <div className={`dashboard-section ${className}`}>
        <div className="text-center py-16 animate-professional-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 bg-muted/30 rounded-full flex items-center justify-center border border-border">
            <BarChart3 className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-3">No Data Available</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Upload CSV data in the Data tab to view pollution analytics and insights.
          </p>
        </div>
      </div>
    );
  }

  const PolAIcon = polAStatus.icon;
  const PolBIcon = polBStatus.icon;

  return (
    <div className={`w-full animate-professional-fade-in font-['Inter',sans-serif] px-1 ${className}`}>
      {/* Responsive KPI Cards - Stacked in Sidebar */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        <div className="bg-card border-border rounded-xl p-4 shadow-sm group hover:bg-muted/50 transition-all duration-300 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 mb-1 font-bold uppercase tracking-wider">Total Stations</p>
              <p className="text-2xl font-black text-foreground">{analytics.totalStations}</p>
              <div className="mt-2 text-[10px] text-blue-600 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full inline-block">
                Active network
              </div>
            </div>
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {visiblePollutants.includes("pol_a") && (
          <div className="bg-card border-border rounded-xl p-4 shadow-sm group hover:bg-muted/50 transition-all duration-300 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mb-1 font-bold uppercase tracking-wider">Avg Pol A</p>
                <p className="text-2xl font-black text-foreground">{analytics.avgPolA}</p>
                <div className={`mt-2 text-[10px] px-2 py-0.5 rounded-full inline-block border ${polAStatus.status === 'Low' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                  polAStatus.status === 'Medium' ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                    'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20'
                  }`}>
                  {polAStatus.status} level
                </div>
              </div>
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                <PolAIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        )}

        {visiblePollutants.includes("pol_b") && (
          <div className="bg-card border-border rounded-xl p-4 shadow-sm group hover:bg-muted/50 transition-all duration-300 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-purple-600 dark:text-purple-400 mb-1 font-bold uppercase tracking-wider">Avg Pol B</p>
                <p className="text-2xl font-black text-foreground">{analytics.avgPolB}</p>
                <div className={`mt-2 text-[10px] px-2 py-0.5 rounded-full inline-block border ${polBStatus.status === 'Low' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                  polBStatus.status === 'Medium' ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                    'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20'
                  }`}>
                  {polBStatus.status} level
                </div>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                <PolBIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-card border-border rounded-xl p-4 shadow-sm group hover:bg-muted/50 transition-all duration-300 border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-orange-600 dark:text-orange-400 mb-1 font-bold uppercase tracking-wider">Samples</p>
              <p className="text-2xl font-black text-foreground">{stationData.length > 0 ? stationData.length : "N/A"}</p>
              <div className="mt-2 text-[10px] text-orange-600 dark:text-orange-300 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full inline-block">
                Refreshed
              </div>
            </div>
            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center border border-orange-500/20 group-hover:bg-orange-500/20 transition-colors">
              <Database className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts - Stacked in Sidebar */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="bg-card border-border rounded-xl p-6 shadow-sm relative overflow-hidden group border">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors"></div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Network Pollution Profile
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#666', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#666', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{
                    backgroundColor: 'rgba(5, 7, 6, 0.95)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
                />
                {visiblePollutants.includes("pol_a") && (
                  <Bar
                    dataKey="pol_a"
                    fill="#10b981"
                    name="Poluente A"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1500}
                    barSize={20}
                  />
                )}
                {visiblePollutants.includes("pol_b") && (
                  <Bar
                    dataKey="pol_b"
                    fill="#8b5cf6"
                    name="Poluente B"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1500}
                    barSize={20}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border-border rounded-xl p-6 shadow-sm relative overflow-hidden group border">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors"></div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Pollutant Synergy Trend
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stationData.slice(0, 50)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="station_id" hide={true} />
                <YAxis
                  tick={{ fill: '#666', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(5, 7, 6, 0.95)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
                />
                {visiblePollutants.includes("pol_a") && (
                  <Line
                    type="monotone"
                    dataKey="pol_a"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: '#10b981' }}
                    name="Poluente A"
                    animationDuration={2000}
                  />
                )}
                {visiblePollutants.includes("pol_b") && (
                  <Line
                    type="monotone"
                    dataKey="pol_b"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: '#8b5cf6' }}
                    name="Poluente B"
                    animationDuration={2000}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Metrics - Stacked in Sidebar */}
      <div className="flex flex-col gap-6">
        <div className="bg-card border-border rounded-xl p-6 shadow-sm relative overflow-hidden group border">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Air Quality Class
          </h3>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChartComponent>
                <Pie
                  data={analytics.pollutionLevels}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={8}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {analytics.pollutionLevels.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(5, 7, 6, 0.95)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)'
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                />
              </PieChartComponent>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-card border-border rounded-xl p-6 shadow-sm relative overflow-hidden group border">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 text-shadow-emerald" />
            Environmental Alerts
          </h3>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
            {stationData
              .filter(s => s.pol_a > 8 || s.pol_b > 8)
              .slice(0, 5)
              .map((station, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-xl hover:bg-emerald-500/5 hover:border-emerald-500/10 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10">
                      <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{station.station_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold uppercase">Critical</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {station.pol_a > 8 ? `Pol A: ${station.pol_a}` : `Pol B: ${station.pol_b}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground font-mono tracking-tighter">
                      {station.sample_dt ? new Date(station.sample_dt).toTimeString().split(' ')[0] : 'N/A'}
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-1">ID: {station.station_id.substring(0, 8)}</p>
                  </div>
                </div>
              ))}

            {stationData.filter(s => s.pol_a > 8 || s.pol_b > 8).length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <ShieldCheck className="w-12 h-12 text-emerald-600 dark:text-emerald-500/50 mb-3" />
                <p className="text-sm font-bold text-foreground">Network Stable</p>
                <p className="text-[10px] text-muted-foreground mt-2">Zero critical anomalies detected in active network.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

PollutionDashboard.displayName = 'PollutionDashboard';

export default PollutionDashboard;