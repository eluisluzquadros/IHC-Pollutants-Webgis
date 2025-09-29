import { StationData } from "@/utils/csvImporter";

// Backend API configuration
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3001' 
  : `https://${window.location.hostname.replace('5000', '3001')}`;

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

class OpenAIService {
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
        const prev = dailyAvgs[i-1];
        const prevPrev = dailyAvgs[i-2];

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
      return {
        message: stationData.length === 0 
          ? "I don't have any data to analyze yet. Please import some CSV data first, and I'll be able to provide detailed insights about pollution patterns and trends."
          : `I apologize, but I'm experiencing some technical difficulties connecting to my AI analysis service. However, I can tell you that you have ${context.totalRecords} records from ${context.totalStations} stations. The average pollution levels are ${context.pollutionStats.polA.avg.toFixed(2)} (Type A) and ${context.pollutionStats.polB.avg.toFixed(2)} (Type B). Please try rephrasing your question.`,
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
        issues: ['No data available'],
        recommendations: ['Import station data to begin analysis']
      };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check data completeness
    const missingData = stationData.filter(d => !d.station_name || !d.lat || !d.lon || d.pol_a === undefined || d.pol_b === undefined);
    if (missingData.length > 0) {
      issues.push(`${missingData.length} records have missing essential fields`);
      recommendations.push('Ensure all records include station name, coordinates, and pollution measurements');
    }

    // Check temporal coverage
    const dates = stationData.map(d => new Date(d.sample_dt));
    const dateRange = Math.max(...dates.map(d => d.getTime())) - Math.min(...dates.map(d => d.getTime()));
    const daysCovered = dateRange / (1000 * 60 * 60 * 24);
    
    if (daysCovered < 7) {
      issues.push('Limited temporal coverage (less than 1 week)');
      recommendations.push('Collect data over longer periods for better trend analysis');
    }

    // Check geographic coverage
    const uniqueStations = new Set(stationData.map(d => d.station_id)).size;
    if (uniqueStations < 5) {
      issues.push('Limited geographic coverage (fewer than 5 stations)');
      recommendations.push('Add more monitoring stations for comprehensive spatial analysis');
    }

    // Determine overall quality
    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    if (issues.length === 0) quality = 'excellent';
    else if (issues.length <= 2) quality = 'good';
    else if (issues.length <= 4) quality = 'fair';
    else quality = 'poor';

    return { quality, issues, recommendations };
  }
}

export const openaiService = new OpenAIService();