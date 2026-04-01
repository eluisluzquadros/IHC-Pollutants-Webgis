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
    isSpatiallyFiltered?: boolean;
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
    data,
    visiblePollutants,
    maxPolA,
    maxPolB,
    isSpatiallyFiltered = false
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
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <Calculator className="w-12 h-12 mb-4 opacity-20" />
                <p>No data available for statistical analysis.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-professional-fade-in px-1">
            <div className="flex flex-col gap-4">
                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-emerald-500" />
                    Análise Estatística
                </h2>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 bg-card border-border text-emerald-600 dark:text-emerald-400 hover:bg-muted"
                    onClick={() => generatePDFReport(data, visiblePollutants, isSpatiallyFiltered)}
                >
                    <Download className="w-4 h-4" />
                    Exportar Relatório PDF
                </Button>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-muted/50 border-border p-1 rounded-xl">
                    <TabsTrigger value="overview" className="text-[10px] uppercase font-bold tracking-tighter data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        Resumo
                    </TabsTrigger>
                    <TabsTrigger value="analysis" className="text-[10px] uppercase font-bold tracking-tighter data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        Visual
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="text-[10px] uppercase font-bold tracking-tighter data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        Insights
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-6">
                    <div className="grid grid-cols-1 gap-4">
                        {showA && stats.statsA && (
                            <Card className="bg-card border-border shadow-sm overflow-hidden">
                                <CardHeader className="bg-emerald-500/10 py-3 border-b border-border">
                                    <CardTitle className="text-xs font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                        Estatísticas - Poluição A
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 grid grid-cols-2 gap-y-4 gap-x-2">
                                    <StatItem label="Média" value={stats.statsA.mean.toFixed(2)} unit={data[0].unit} />
                                    <StatItem label="Mediana" value={stats.statsA.median.toFixed(2)} unit={data[0].unit} />
                                    <StatItem label="Desv. Padrão" value={stats.statsA.stdDev.toFixed(2)} unit="" />
                                    <StatItem label="Máximo" value={stats.statsA.max.toFixed(2)} unit={data[0].unit} color="text-red-600" />
                                    <StatItem label="Q1" value={stats.statsA.q1.toFixed(2)} unit="" />
                                    <StatItem label="Q3" value={stats.statsA.q3.toFixed(2)} unit="" />
                                </CardContent>
                            </Card>
                        )}

                        {showB && stats.statsB && (
                            <Card className="bg-card border-border shadow-sm overflow-hidden">
                                <CardHeader className="bg-blue-500/10 py-3 border-b border-border">
                                    <CardTitle className="text-xs font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                        Estatísticas - Poluição B
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-4 grid grid-cols-2 gap-y-4 gap-x-2">
                                    <StatItem label="Média" value={stats.statsB.mean.toFixed(2)} unit={data[0].unit} />
                                    <StatItem label="Mediana" value={stats.statsB.median.toFixed(2)} unit={data[0].unit} />
                                    <StatItem label="Desv. Padrão" value={stats.statsB.stdDev.toFixed(2)} unit="" />
                                    <StatItem label="Máximo" value={stats.statsB.max.toFixed(2)} unit={data[0].unit} color="text-red-600" />
                                    <StatItem label="Q1" value={stats.statsB.q1.toFixed(2)} unit="" />
                                    <StatItem label="Q3" value={stats.statsB.q3.toFixed(2)} unit="" />
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {(showA && showB) && (
                        <Card className="bg-card border-border shadow-sm">
                            <CardContent className="p-4 flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest">Correlação</p>
                                        <p className="text-2xl font-black text-foreground">{stats.correlation?.toFixed(3)}</p>
                                    </div>
                                </div>
                                <div className="w-full">
                                    <Badge className="w-full justify-center bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                        Relação {Math.abs(stats.correlation || 0) > 0.7 ? 'Forte' :
                                            Math.abs(stats.correlation || 0) > 0.4 ? 'Moderada' : 'Fraca'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4 mt-6">
                    {showA && showB && (
                        <Card className="bg-card border-border p-4 shadow-sm">
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                <LineChartIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                Matriz de Correlação
                            </h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                        <XAxis type="number" dataKey="x" name="Pollution A" unit={data[0].unit} />
                                        <YAxis type="number" dataKey="y" name="Pollution B" unit={data[0].unit} />
                                        <ZAxis type="category" dataKey="name" name="Station" />
                                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'rgba(5,7,6,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
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

                    <div className="flex flex-col gap-4">
                        {showA && (
                            <Card className="bg-card border-border p-4 shadow-sm">
                                <h3 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4">Distribuição Poluição A</h3>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={generateHistogramData(data.map(d => d.pol_a))}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                            <XAxis dataKey="range" fontSize={10} />
                                            <YAxis fontSize={10} />
                                            <Tooltip />
                                            <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} animationDuration={1500} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        )}
                        {showB && (
                            <Card className="bg-card border-border p-4 shadow-sm">
                                <h3 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">Distribuição Poluição B</h3>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={generateHistogramData(data.map(d => d.pol_b))}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                                            <XAxis dataKey="range" fontSize={10} tick={{ fill: '#666' }} />
                                            <YAxis fontSize={10} tick={{ fill: '#666' }} />
                                            <Tooltip contentStyle={{ backgroundColor: 'rgba(5,7,6,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} animationDuration={1500} />
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
                                title="Tendência Poluição A"
                                description={`Os dados mostram uma tendência ${stats.trendA > 0 ? 'de alta' : 'de queda'} nos pontos de amostragem.`}
                                icon={stats.trendA > 0 ? TrendingUp : TrendingDown}
                                color={stats.trendA > 0 ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}
                            />
                        )}

                        {/* Anomaly Insight */}
                        {(stats.anomaliesA.length > 0 || stats.anomaliesB.length > 0) ? (
                            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl space-y-3 shadow-xl">
                                <div className="flex items-center gap-2 text-orange-400 font-bold text-xs uppercase tracking-widest">
                                    <AlertCircle className="w-5 h-5" />
                                    {stats.anomaliesA.length + stats.anomaliesB.length} Anomalias Detectadas
                                </div>
                                <div className="space-y-2">
                                    {stats.anomaliesA.slice(0, 3).map((a, i) => (
                                        <div key={`a-${i}`} className="text-xs text-orange-600 dark:text-orange-400 bg-orange-500/10 p-2 rounded border border-orange-500/20">
                                            <strong>Pol A:</strong> {data[a.index].station_name} ({a.severity} outlier)
                                        </div>
                                    ))}
                                    {stats.anomaliesB.slice(0, 3).map((a, i) => (
                                        <div key={`b-${i}`} className="text-xs text-orange-600 dark:text-orange-400 bg-orange-500/10 p-2 rounded border border-orange-500/20">
                                            <strong>Pol B:</strong> {data[a.index].station_name} ({a.severity} outlier)
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <InsightCard
                                title="Consistência dos Dados"
                                description="Nenhuma anomalia estatística significativa detectada no conjunto de dados filtrado."
                                icon={Info}
                                color="text-blue-400 bg-blue-500/10"
                            />
                        )}

                        {/* Relationship Insight */}
                        {showA && showB && (
                            <InsightCard
                                title="Padrão de Relação"
                                description={stats.correlation! > 0.6
                                    ? "Correlação positiva forte: Poluição A e B geralmente sobem e caem juntas."
                                    : stats.correlation! < -0.6
                                        ? "Correlação negativa forte: Conforme a Poluição A aumenta, a B geralmente diminui."
                                        : "Poluição A e B mostram correlação linear fraca neste conjunto de dados."
                                }
                                icon={BarChart3}
                                color="text-purple-400 bg-purple-500/10"
                            />
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

// Helper Components
const StatItem = ({ label, value, unit, color = "text-foreground" }: { label: string, value: string, unit: string, color?: string }) => (
    <div className="flex flex-col">
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{label}</span>
        <span className={`text-lg font-black ${color}`}>{value} <span className="text-[10px] font-normal opacity-50">{unit}</span></span>
    </div>
);

const InsightCard = ({ title, description, icon: Icon, color }: { title: string, description: string, icon: any, color: string }) => (
    <div className={`p-4 rounded-xl border border-border bg-card shadow-sm flex gap-4 items-start hover:border-border/80 transition-all`}>
        <div className={`p-2 rounded-lg ${color.split(' ')[1]}`}>
            <Icon className={`w-5 h-5 ${color.split(' ')[0]}`} />
        </div>
        <div>
            <h4 className="text-sm font-bold text-foreground mb-1 tracking-tight">{title}</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">{description}</p>
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
