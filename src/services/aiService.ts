import { StationData } from "@/utils/csvImporter";

// Backend API configuration 
const getApiBaseUrl = (): string => {
  // Check for environment variable override first (production deployment)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Use relative path for API calls (proxied by Vite in dev, direct in prod)
  return '';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 AI Service API URL:', API_BASE_URL);

export interface MapCommand {
  type: 'focus_station' | 'filter_data' | 'highlight_stations' | 'set_zoom' | 'apply_time_filter';
  data: any;
}

export interface AIResponse {
  message: string;
  mapCommands?: MapCommand[];
  data?: any;
}

export interface DataContext {
  totalStations: number;
  totalRecords: number;
  dateRange: { start: string; end: string };
  pollutionStats: {
    polA: { avg: number; max: number; min: number; high_count: number };
    polB: { avg: number; max: number; min: number; high_count: number };
  };
  stationSummary: Array<{
    id: string;
    name: string;
    location: { lat: number; lon: number };
    avgPolA: number;
    avgPolB: number;
    recordCount: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  geographicInsights: {
    clusters: any[];
    outliers: any[];
  };
  temporalPatterns: {
    trends: any[];
    anomalies: any[];
  };
}

export class AIService {
  private buildDataContext(stationData: StationData[]): DataContext {
    if (stationData.length === 0) {
      return {
        totalStations: 0,
        totalRecords: 0,
        dateRange: { start: '', end: '' },
        pollutionStats: {
          polA: { avg: 0, max: 0, min: 0, high_count: 0 },
          polB: { avg: 0, max: 0, min: 0, high_count: 0 }
        },
        stationSummary: [],
        geographicInsights: { clusters: [], outliers: [] },
        temporalPatterns: { trends: [], anomalies: [] }
      };
    }

    const totalStations = new Set(stationData.map(d => d.station_id)).size;
    const totalRecords = stationData.length;

    // Date range
    const dates = stationData.map(d => new Date(d.sample_dt)).sort();
    const dateRange = {
      start: dates[0]?.toISOString().split('T')[0] || '',
      end: dates[dates.length - 1]?.toISOString().split('T')[0] || ''
    };

    // Pollution statistics
    const polAValues = stationData.map(d => d.pol_a);
    const polBValues = stationData.map(d => d.pol_b);

    const pollutionStats = {
      polA: {
        avg: polAValues.reduce((sum, val) => sum + val, 0) / polAValues.length,
        max: Math.max(...polAValues),
        min: Math.min(...polAValues),
        high_count: polAValues.filter(val => val > 7).length
      },
      polB: {
        avg: polBValues.reduce((sum, val) => sum + val, 0) / polBValues.length,
        max: Math.max(...polBValues),
        min: Math.min(...polBValues),
        high_count: polBValues.filter(val => val > 7).length
      }
    };

    // Station-level analysis
    const stationGroups = stationData.reduce((groups, record) => {
      if (!groups[record.station_id]) {
        groups[record.station_id] = [];
      }
      groups[record.station_id].push(record);
      return groups;
    }, {} as Record<string, StationData[]>);

    const stationSummary = Object.entries(stationGroups).map(([stationId, records]) => {
      const avgPolA = records.reduce((sum, r) => sum + r.pol_a, 0) / records.length;
      const avgPolB = records.reduce((sum, r) => sum + r.pol_b, 0) / records.length;
      const maxPol = Math.max(avgPolA, avgPolB);

      return {
        id: stationId,
        name: records[0].station_name,
        location: { lat: records[0].lat, lon: records[0].lon },
        avgPolA,
        avgPolB,
        recordCount: records.length,
        riskLevel: maxPol > 7 ? 'high' : maxPol > 3 ? 'medium' : 'low' as 'low' | 'medium' | 'high'
      };
    });

    // Geographic insights - find outliers and clusters
    const geographicInsights = this.analyzeGeographicPatterns(stationSummary);

    // Temporal patterns - analyze trends over time
    const temporalPatterns = this.analyzeTemporalPatterns(stationData);

    return {
      totalStations,
      totalRecords,
      dateRange,
      pollutionStats,
      stationSummary,
      geographicInsights,
      temporalPatterns
    };
  }

  private analyzeGeographicPatterns(stations: any[]): { clusters: any[]; outliers: any[] } {
    // Simple clustering based on pollution levels and geographic proximity
    const highRiskStations = stations.filter(s => s.riskLevel === 'high');
    const clusters = [];
    const outliers = [];

    // Find stations that are geographically close and have similar pollution levels
    highRiskStations.forEach(station => {
      const nearby = stations.filter(s =>
        s.id !== station.id &&
        Math.abs(s.location.lat - station.location.lat) < 0.1 &&
        Math.abs(s.location.lon - station.location.lon) < 0.1 &&
        s.riskLevel === 'high'
      );

      if (nearby.length > 0) {
        clusters.push({
          center: station,
          nearby: nearby,
          avgPollution: (station.avgPolA + station.avgPolB) / 2
        });
      } else {
        outliers.push(station);
      }
    });

    return { clusters, outliers };
  }

  private analyzeTemporalPatterns(stationData: StationData[]): { trends: any[]; anomalies: any[] } {
    // Group by date to see trends over time
    const dateGroups = stationData.reduce((groups, record) => {
      const date = record.sample_dt.split('T')[0];
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(record);
      return groups;
    }, {} as Record<string, StationData[]>);

    const dailyAvgs = Object.entries(dateGroups).map(([date, records]) => ({
      date,
      avgPolA: records.reduce((sum, r) => sum + r.pol_a, 0) / records.length,
      avgPolB: records.reduce((sum, r) => sum + r.pol_b, 0) / records.length,
      recordCount: records.length
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Simple trend detection
    const trends = [];
    const anomalies = [];

    if (dailyAvgs.length > 3) {
      for (let i = 2; i < dailyAvgs.length; i++) {
        const current = dailyAvgs[i];
        const prev = dailyAvgs[i - 1];
        const prevPrev = dailyAvgs[i - 2];

        // Trend detection (3 consecutive increases/decreases)
        if (current.avgPolA > prev.avgPolA && prev.avgPolA > prevPrev.avgPolA) {
          trends.push({ type: 'increasing', date: current.date, pollutant: 'A' });
        }
        if (current.avgPolA < prev.avgPolA && prev.avgPolA < prevPrev.avgPolA) {
          trends.push({ type: 'decreasing', date: current.date, pollutant: 'A' });
        }

        // Anomaly detection (sudden spikes)
        const avgLevel = dailyAvgs.reduce((sum, d) => sum + d.avgPolA, 0) / dailyAvgs.length;
        const stdDev = Math.sqrt(dailyAvgs.reduce((sum, d) => sum + Math.pow(d.avgPolA - avgLevel, 2), 0) / dailyAvgs.length);

        if (Math.abs(current.avgPolA - avgLevel) > 2 * stdDev) {
          anomalies.push({
            date: current.date,
            value: current.avgPolA,
            type: current.avgPolA > avgLevel ? 'spike' : 'drop',
            pollutant: 'A'
          });
        }
      }
    }

    return { trends, anomalies };
  }

  async generateResponse(userQuery: string, stationData: StationData[]): Promise<AIResponse> {
    try {
      console.log('🤖 Calling backend AI service with query:', userQuery);

      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userQuery,
          stationData: stationData
        })
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🤖 Backend AI response received:', result);

      return {
        message: result.message,
        mapCommands: result.mapCommands || [],
        data: result.data
      };
    } catch (error) {
      console.error('AI Service Error:', error);

      // Fallback response with basic data context
      const context = this.buildDataContext(stationData);
      
      let fallbackMessage = "";
      if (stationData.length === 0) {
        if (userQuery.toLowerCase().includes("o que") || userQuery.toLowerCase().includes("envibase")) {
          fallbackMessage = "A Envibase é um Sistema de Gerenciamento de Dados Ambientais (SGDA) de última geração. Para começar, você pode importar seus dados CSV no dashboard principal. Lá, eu poderei ajudá-lo a analisar tendências de poluição, identificar anomalias geográficas e gerar relatórios automáticos.";
        } else {
          fallbackMessage = "No momento não tenho dados carregados para análise. Experimente acessar a plataforma para importar seus arquivos e desbloquear todo o potencial da minha inteligência analítica.";
        }
      } else {
        fallbackMessage = `Desculpe, tive um pequeno problema técnico ao processar sua análise profunda, mas consigo ver que você tem ${context.totalRecords} registros em ${context.totalStations} estações operacionais. Como posso ajudar com esses dados?`;
      }

      return {
        message: fallbackMessage,
        mapCommands: [],
        data: context
      };
    }
  }

  async analyzeDataQuality(stationData: StationData[]): Promise<{
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    issues: string[];
    recommendations: string[];
  }> {
    if (stationData.length === 0) {
      return {
        quality: 'poor',
        issues: ['Sem dados disponíveis'],
        recommendations: ['Importe dados para começar']
      };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Determinar qualidade
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'good';

    return { quality, issues, recommendations };
  }
}

export const aiService = new AIService();