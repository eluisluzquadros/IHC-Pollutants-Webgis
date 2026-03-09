import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ScatterChart, Scatter, ZAxis, Cell, LineChart, Line, Legend
} from 'recharts';
import {
    Calculator, LineChart as LineChartIcon, Lightbulb, Download,
    TrendingUp, TrendingDown, AlertCircle, Info, BarChart3
} from 'lucide-react';
import { calculateStats, calculateCorrelation, detectAnomalies, calculateTrend } from '@/utils/statisticsEngine';
import { generatePDFReport } from '@/utils/reportGenerator';
import { StationData } from '@/utils/csvImporter';

interface StatisticsPanelProps {
    data: StationData[];
    visiblePollutants: string[];
    maxPolA: number;
    maxPolB: number;
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
    data,
    visiblePollutants,
    maxPolA,
    maxPolB
}) => {
    const showA = visiblePollutants.includes('pol_a');
    const showB = visiblePollutants.includes('pol_b');

    const stats = useMemo(() => {
        if (data.length === 0) return null;

        const polAValues = data.map(d => d.pol_a);
        const polBValues = data.map(d => d.pol_b);

        const statsA = showA ? calculateStats(polAValues) : null;
        const statsB = showB ? calculateStats(polBValues) : null;
        const correlation = (showA && showB) ? calculateCorrelation(polAValues, polBValues) : null;
        const anomaliesA = showA ? detectAnomalies(polAValues) : [];
        const anomaliesB = showB ? detectAnomalies(polBValues) : [];
        const trendA = showA ? calculateTrend(polAValues) : 0;
        const trendB = showB ? calculateTrend(polBValues) : 0;

        // Scatter data for correlation
        const scatterData = data.map(d => ({
            x: d.pol_a,
            y: d.pol_b,
            name: d.station_name
        }));

        return { statsA, statsB, correlation, anomaliesA, anomaliesB, trendA, trendB, scatterData };
    }, [data, showA, showB]);

    if (!stats || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                <Calculator className="w-12 h-12 mb-4 opacity-20" />
                <p>No data available for statistical analysis.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-professional-fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-blue-600" />
                    Statistical Analysis
                </h2>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => generatePDFReport(data, visiblePollutants)}
                >
                    <Download className="w-4 h-4" />
                    Export Report
                </Button>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1">
                    <TabsTrigger value="overview" className="gap-2">
                        <Calculator className="w-4 h-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="gap-2">
                        <LineChartIcon className="w-4 h-4" />
                        Visual Analysis
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Insights
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {showA && stats.statsA && (
                            <Card className="border-emerald-100 shadow-sm overflow-hidden">
                                <CardHeader className="bg-emerald-50/50 py-3">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-800">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                        Pollution A Statistics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 grid grid-cols-2 gap-y-4 gap-x-2">
                                    <StatItem label="Mean" value={stats.statsA.mean.toFixed(2)} unit={data[0].unit} />
                                    <StatItem label="Median" value={stats.statsA.median.toFixed(2)} unit={data[0].unit} />
                                    <StatItem label="Std Dev" value={stats.statsA.stdDev.toFixed(2)} unit="" />
                                    <StatItem label="Max" value={stats.statsA.max.toFixed(2)} unit={data[0].unit} color="text-red-600" />
                                    <StatItem label="Q1" value={stats.statsA.q1.toFixed(2)} unit="" />
                                    <StatItem label="Q3" value={stats.statsA.q3.toFixed(2)} unit="" />
                                </CardContent>
                            </Card>
                        )}

                        {showB && stats.statsB && (
                            <Card className="border-blue-100 shadow-sm overflow-hidden">
                                <CardHeader className="bg-blue-50/50 py-3">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-blue-800">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                        Pollution B Statistics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 grid grid-cols-2 gap-y-4 gap-x-2">
                                    <StatItem label="Mean" value={stats.statsB.mean.toFixed(2)} unit={data[0].unit} />
                                    <StatItem label="Median" value={stats.statsB.median.toFixed(2)} unit={data[0].unit} />
                                    <StatItem label="Std Dev" value={stats.statsB.stdDev.toFixed(2)} unit="" />
                                    <StatItem label="Max" value={stats.statsB.max.toFixed(2)} unit={data[0].unit} color="text-red-600" />
                                    <StatItem label="Q1" value={stats.statsB.q1.toFixed(2)} unit="" />
                                    <StatItem label="Q3" value={stats.statsB.q3.toFixed(2)} unit="" />
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {(showA && showB) && (
                        <Card className="border-purple-100 shadow-sm">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-purple-600 font-medium uppercase tracking-wider">Correlation Coefficient</p>
                                        <p className="text-2xl font-bold text-purple-900">{stats.correlation?.toFixed(3)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className={`border-purple-200 text-purple-700 bg-purple-50`}>
                                        {Math.abs(stats.correlation || 0) > 0.7 ? 'Strong' :
                                            Math.abs(stats.correlation || 0) > 0.4 ? 'Moderate' : 'Weak'} Relationship
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4 mt-4">
                    {showA && showB && (
                        <Card className="p-4">
                            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                <LineChartIcon className="w-4 h-4 text-purple-500" />
                                Pollution A vs B Correlation
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis type="number" dataKey="x" name="Pollution A" unit={data[0].unit} />
                                        <YAxis type="number" dataKey="y" name="Pollution B" unit={data[0].unit} />
                                        <ZAxis type="category" dataKey="name" name="Station" />
                                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                        <Scatter name="Stations" data={stats.scatterData} fill="#8884d8">
                                            {stats.scatterData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {showA && (
                            <Card className="p-4">
                                <h3 className="text-sm font-semibold mb-4 text-emerald-800">Pollution A Distribution</h3>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={generateHistogramData(data.map(d => d.pol_a))}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                            <XAxis dataKey="range" fontSize={10} />
                                            <YAxis fontSize={10} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        )}
                        {showB && (
                            <Card className="p-4">
                                <h3 className="text-sm font-semibold mb-4 text-blue-800">Pollution B Distribution</h3>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={generateHistogramData(data.map(d => d.pol_b))}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                            <XAxis dataKey="range" fontSize={10} />
                                            <YAxis fontSize={10} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="insights" className="space-y-4 mt-4">
                    <div className="space-y-3">
                        {/* Trend Insight */}
                        {showA && (
                            <InsightCard
                                title="Pollution A Trend"
                                description={`Data shows a ${stats.trendA > 0 ? 'rising' : 'declining'} trend across current sample points.`}
                                icon={stats.trendA > 0 ? TrendingUp : TrendingDown}
                                color={stats.trendA > 0 ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}
                            />
                        )}

                        {/* Anomaly Insight */}
                        {(stats.anomaliesA.length > 0 || stats.anomaliesB.length > 0) ? (
                            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-3">
                                <div className="flex items-center gap-2 text-orange-800 font-semibold text-sm">
                                    <AlertCircle className="w-5 h-5" />
                                    Detected Anomalies ({stats.anomaliesA.length + stats.anomaliesB.length})
                                </div>
                                <div className="space-y-2">
                                    {stats.anomaliesA.slice(0, 3).map((a, i) => (
                                        <div key={`a-${i}`} className="text-xs text-orange-700 bg-white/50 p-2 rounded border border-orange-200/50">
                                            <strong>Pollution A:</strong> {data[a.index].station_name} recorded {a.value} ({a.severity} outlier, Z-score: {a.zScore.toFixed(1)})
                                        </div>
                                    ))}
                                    {stats.anomaliesB.slice(0, 3).map((a, i) => (
                                        <div key={`b-${i}`} className="text-xs text-orange-700 bg-white/50 p-2 rounded border border-orange-200/50">
                                            <strong>Pollution B:</strong> {data[a.index].station_name} recorded {a.value} ({a.severity} outlier, Z-score: {a.zScore.toFixed(1)})
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <InsightCard
                                title="Data Consistency"
                                description="No significant statistical anomalies detected in the current filtered dataset."
                                icon={Info}
                                color="text-blue-600 bg-blue-50"
                            />
                        )}

                        {/* Relationship Insight */}
                        {showA && showB && (
                            <InsightCard
                                title="Relational Pattern"
                                description={stats.correlation! > 0.6
                                    ? "Strong positive correlation: Pollution A and B usually rise and fall together."
                                    : stats.correlation! < -0.6
                                        ? "Strong negative correlation: As Pollution A increases, Pollution B usually decreases."
                                        : "Pollution A and B show weak linear correlation in this dataset."
                                }
                                icon={BarChart3}
                                color="text-purple-600 bg-purple-50"
                            />
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

// Helper Components
const StatItem = ({ label, value, unit, color = "text-gray-900" }: { label: string, value: string, unit: string, color?: string }) => (
    <div className="flex flex-col">
        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">{label}</span>
        <span className={`text-lg font-bold ${color}`}>{value} <span className="text-xs font-normal opacity-70">{unit}</span></span>
    </div>
);

const InsightCard = ({ title, description, icon: Icon, color }: { title: string, description: string, icon: any, color: string }) => (
    <div className={`p-4 rounded-xl border border-transparent transition-all hover:border-gray-200 bg-white shadow-sm flex gap-4 items-start`}>
        <div className={`p-2 rounded-lg ${color.split(' ')[1]}`}>
            <Icon className={`w-5 h-5 ${color.split(' ')[0]}`} />
        </div>
        <div>
            <h4 className="text-sm font-bold text-gray-900 mb-1">{title}</h4>
            <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
        </div>
    </div>
);

const Badge = ({ children, variant, className }: any) => (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${className}`}>
        {children}
    </span>
);

// Utility for histogram
const generateHistogramData = (values: number[]) => {
    if (values.length === 0) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = 7;
    const binSize = (max - min) / binCount || 1;
    const bins = Array.from({ length: binCount }, (_, i) => ({
        range: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
        count: 0
    }));

    values.forEach(v => {
        const binIdx = Math.min(Math.floor((v - min) / binSize), binCount - 1);
        bins[binIdx].count++;
    });

    return bins;
};

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default StatisticsPanel;
