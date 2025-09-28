import React, { memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as PieChartComponent, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, BarChart3, Database, PieChart } from 'lucide-react';

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
  stationData: StationData[];
  /** Optional CSS class name */
  className?: string;
}

interface PollutionStatus {
  status: string;
  color: string;
  icon: React.ComponentType<any>;
}

// Professional color palette for charts
const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6'
} as const;

// Pollution level thresholds
const POLLUTION_THRESHOLDS = {
  LOW: 3,
  HIGH: 7
} as const;

const PollutionDashboard: React.FC<PollutionDashboardProps> = memo(({ 
  stationData = [], 
  className = "" 
}) => {
  // Memoized analytics calculations for optimal performance
  const analytics = useMemo(() => {
    if (stationData.length === 0) {
      return {
        totalStations: 0,
        avgPolA: 0,
        avgPolB: 0,
        highPollutionStations: 0,
        chartData: [],
        pollutionLevels: [],
        trendData: []
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
        const avgA = stationRecords.reduce((sum, d) => sum + d.pol_a, 0) / stationRecords.length;
        const avgB = stationRecords.reduce((sum, d) => sum + d.pol_b, 0) / stationRecords.length;
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

    return {
      totalStations,
      avgPolA: Number(avgPolA.toFixed(2)),
      avgPolB: Number(avgPolB.toFixed(2)),
      highPollutionStations,
      chartData: stationAverages,
      pollutionLevels,
      trendData: []
    };
  }, [stationData]);

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
  if (stationData.length === 0) {
    return (
      <div className={`dashboard-section ${className}`}>
        <div className="text-center py-16 animate-professional-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-professional-heading mb-3">No Data Available</h3>
          <p className="text-professional-body max-w-md mx-auto">
            Upload CSV data to view pollution analytics and insights.
          </p>
        </div>
      </div>
    );
  }

  const PolAIcon = polAStatus.icon;
  const PolBIcon = polBStatus.icon;

  return (
    <div className={`w-full animate-professional-fade-in ${className}`}>
      {/* Responsive KPI Cards - Optimized for wider sidebar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="kpi-card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="kpi-card-content">
            <div className="kpi-card-info">
              <p className="text-xs text-blue-600 mb-1">Total Stations</p>
              <p className="text-xl font-bold text-blue-900 mb-2">{analytics.totalStations}</p>
              <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                Active monitoring
              </div>
            </div>
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="kpi-card bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="kpi-card-content">
            <div className="kpi-card-info">
              <p className="text-xs text-emerald-600 mb-1">Avg Pollution A</p>
              <p className="text-xl font-bold text-emerald-900 mb-2">{analytics.avgPolA}</p>
              <div className={`text-xs px-2 py-1 rounded-full ${
                polAStatus.status === 'Low' ? 'text-emerald-700 bg-emerald-100' :
                polAStatus.status === 'Medium' ? 'text-yellow-700 bg-yellow-100' :
                'text-red-700 bg-red-100'
              }`}>
                {polAStatus.status} level
              </div>
            </div>
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <PolAIcon className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="kpi-card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="kpi-card-content">
            <div className="kpi-card-info">
              <p className="text-xs text-purple-600 mb-1">Avg Pollution B</p>
              <p className="text-xl font-bold text-purple-900 mb-2">{analytics.avgPolB}</p>
              <div className={`text-xs px-2 py-1 rounded-full ${
                polBStatus.status === 'Low' ? 'text-emerald-700 bg-emerald-100' :
                polBStatus.status === 'Medium' ? 'text-yellow-700 bg-yellow-100' :
                'text-red-700 bg-red-100'
              }`}>
                {polBStatus.status} level
              </div>
            </div>
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <PolBIcon className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="kpi-card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="kpi-card-content">
            <div className="kpi-card-info">
              <p className="text-xs text-orange-600 mb-1">Data Points</p>
              <p className="text-xl font-bold text-orange-900 mb-2">{stationData.length}</p>
              <div className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                Records loaded
              </div>
            </div>
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section - Optimized for wider sidebar */}
      <div className="space-y-6">
        {/* Pollution Levels Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Pollution Levels Overview
            </h3>
            <div className="flex gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Pol A</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600">Pol B</span>
              </div>
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="pol_a" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="pol_b" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Analysis Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Pollution Trends
            </h3>
            <div className="text-xs text-gray-500">
              Last {Math.min(analytics.chartData.length, 10)} stations
            </div>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.chartData.slice(0, 10)} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pol_a" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 4, stroke: '#3b82f6', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pol_b" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 4, stroke: '#8b5cf6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-500" />
              Pollution Distribution
            </h3>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChartComponent margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <Pie
                  data={analytics.pollutionLevels}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {analytics.pollutionLevels.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="circle"
                />
              </PieChartComponent>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
});

PollutionDashboard.displayName = 'PollutionDashboard';

export default PollutionDashboard;