import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, BarChart3 } from 'lucide-react';

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
  stationData: StationData[];
  className?: string;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function PollutionDashboard({ 
  stationData = [], 
  className = "" 
}: PollutionDashboardProps) {
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
    const highPollutionStations = stationData.filter(d => d.pol_a > 7 || d.pol_b > 7).length;

    // Chart data for top stations
    const stationAverages = Array.from(new Set(stationData.map(d => d.station_id)))
      .map(stationId => {
        const stationRecords = stationData.filter(d => d.station_id === stationId);
        const avgA = stationRecords.reduce((sum, d) => sum + d.pol_a, 0) / stationRecords.length;
        const avgB = stationRecords.reduce((sum, d) => sum + d.pol_b, 0) / stationRecords.length;
        return {
          station: stationRecords[0].station_name.length > 12 
            ? stationRecords[0].station_name.substring(0, 12) + '...'
            : stationRecords[0].station_name,
          pol_a: Number(avgA.toFixed(1)),
          pol_b: Number(avgB.toFixed(1))
        };
      })
      .sort((a, b) => (b.pol_a + b.pol_b) - (a.pol_a + a.pol_b))
      .slice(0, 6);

    // Pollution level distribution
    const pollutionLevels = [
      { name: 'Low (< 3)', value: stationData.filter(d => d.pol_a < 3 && d.pol_b < 3).length, color: '#10B981' },
      { name: 'Medium (3-7)', value: stationData.filter(d => (d.pol_a >= 3 && d.pol_a <= 7) || (d.pol_b >= 3 && d.pol_b <= 7)).length, color: '#F59E0B' },
      { name: 'High (> 7)', value: stationData.filter(d => d.pol_a > 7 || d.pol_b > 7).length, color: '#EF4444' }
    ];

    // Time series data (simplified)
    const trendData = stationData
      .sort((a, b) => new Date(a.sample_dt).getTime() - new Date(b.sample_dt).getTime())
      .slice(0, 15)
      .map(d => ({
        date: new Date(d.sample_dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pol_a: d.pol_a,
        pol_b: d.pol_b
      }));

    return {
      totalStations,
      avgPolA: Number(avgPolA.toFixed(2)),
      avgPolB: Number(avgPolB.toFixed(2)),
      highPollutionStations,
      chartData: stationAverages,
      pollutionLevels,
      trendData
    };
  }, [stationData]);

  const getPollutionStatus = (value: number) => {
    if (value < 3) return { status: 'Low', color: 'status-professional-success', icon: TrendingDown };
    if (value <= 7) return { status: 'Medium', color: 'status-professional-warning', icon: Activity };
    return { status: 'High', color: 'status-professional-error', icon: AlertTriangle };
  };

  const polAStatus = getPollutionStatus(analytics.avgPolA);
  const polBStatus = getPollutionStatus(analytics.avgPolB);
  const PolAIcon = polAStatus.icon;
  const PolBIcon = polBStatus.icon;

  if (stationData.length === 0) {
    return (
      <div className={`dashboard-section ${className}`}>
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-professional-heading mb-3">No Data Available</h3>
          <p className="text-professional-body max-w-md mx-auto">Upload CSV data to view pollution analytics and insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Professional KPI Cards with generous spacing */}
      <div className="dashboard-kpi-grid">
        <div className="kpi-card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="kpi-card-content">
            <div className="kpi-card-info">
              <p className="text-professional-caption text-blue-600 mb-2">Total Stations</p>
              <p className="text-3xl sm:text-4xl font-bold text-blue-900 mb-3">{analytics.totalStations}</p>
              <div className="status-professional status-professional-info">
                Active monitoring
              </div>
            </div>
            <div className="kpi-card-icon bg-blue-500">
              <Activity className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="kpi-card bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="kpi-card-content">
            <div className="kpi-card-info">
              <p className="text-professional-caption text-emerald-600 mb-2">Avg Pollution A</p>
              <p className="text-3xl sm:text-4xl font-bold text-emerald-900 mb-3">{analytics.avgPolA}</p>
              <div className={`status-professional ${polAStatus.color}`}>
                {polAStatus.status} level
              </div>
            </div>
            <div className="kpi-card-icon bg-emerald-500">
              <PolAIcon className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="kpi-card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="kpi-card-content">
            <div className="kpi-card-info">
              <p className="text-professional-caption text-purple-600 mb-2">Avg Pollution B</p>
              <p className="text-3xl sm:text-4xl font-bold text-purple-900 mb-3">{analytics.avgPolB}</p>
              <div className={`status-professional ${polBStatus.color}`}>
                {polBStatus.status} level
              </div>
            </div>
            <div className="kpi-card-icon bg-purple-500">
              <PolBIcon className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="kpi-card bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="kpi-card-content">
            <div className="kpi-card-info">
              <p className="text-professional-caption text-red-600 mb-2">High Pollution</p>
              <p className="text-3xl sm:text-4xl font-bold text-red-900 mb-3">{analytics.highPollutionStations}</p>
              <div className="status-professional status-professional-error">
                Stations at risk
              </div>
            </div>
            <div className="kpi-card-icon bg-red-500">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Professional Charts with generous spacing */}
      <div className="dashboard-chart-grid">
        {/* Top Stations Chart */}
        <div className="chart-container lg:col-span-2">
          <div className="chart-header">
            <h3 className="text-professional-heading">Top Polluted Stations</h3>
            <p className="text-professional-caption">Stations with highest average pollution levels</p>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="station" 
                  fontSize={11}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  stroke="#64748b"
                />
                <YAxis fontSize={11} stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="pol_a" fill="#3B82F6" name="Pollution A" radius={[2, 2, 0, 0]} />
                <Bar dataKey="pol_b" fill="#EF4444" name="Pollution B" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pollution Distribution */}
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="text-professional-heading">Pollution Distribution</h3>
            <p className="text-professional-caption">Distribution of pollution severity levels</p>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.pollutionLevels}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.pollutionLevels.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Time Series Chart with generous spacing */}
      {analytics.trendData.length > 0 && (
        <div className="dashboard-section">
          <div className="chart-container">
            <div className="chart-header">
              <h3 className="text-professional-heading">Pollution Trends Over Time</h3>
              <p className="text-professional-caption">Recent pollution measurements timeline</p>
            </div>
            <div className="chart-content">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" fontSize={11} stroke="#64748b" />
                  <YAxis fontSize={11} stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pol_a" 
                    stroke="#3B82F6" 
                    strokeWidth={3} 
                    name="Pollution A"
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pol_b" 
                    stroke="#EF4444" 
                    strokeWidth={3} 
                    name="Pollution B"
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}