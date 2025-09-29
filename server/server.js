// Environment variables are automatically injected by Replit
// No need for dotenv in Replit environment
console.log('🔧 Using Replit environment variables');

const express = require('express');
const cors = require('cors');
const OpenAI = require('openai').default;

// Import database connection
const { db } = require('./db.js');
const { stations, pollutionRecords } = require('../shared/schema.js');
const { eq, sql } = require('drizzle-orm');

const app = express();
// Use Replit's assigned PORT or fallback to 3001 for development
const port = process.env.PORT || 3001;

// Configure CORS for Replit environment
app.use(cors({
  origin: [
    'http://localhost:5000',
    'https://localhost:5000',
    process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null,
    process.env.REPLIT_DEV_DOMAIN ? `http://${process.env.REPLIT_DEV_DOMAIN}` : null,
    // Allow all Replit domains
    /^https:\/\/.*\.replit\.dev$/,
    /^https:\/\/.*\.kirk\.replit\.dev$/
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Initialize OpenAI with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// OpenAI chat endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, stationData } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Advanced analytics for intelligent AI responses
    const buildAdvancedDataContext = (stationData) => {
      if (!stationData || stationData.length === 0) {
        return {
          totalStations: 0,
          totalRecords: 0,
          dateRange: { start: '', end: '' },
          pollutionStats: {
            polA: { avg: 0, max: 0, min: 0, high_count: 0 },
            polB: { avg: 0, max: 0, min: 0, high_count: 0 }
          },
          stationSummary: [],
          advancedAnalytics: {
            anomalies: [],
            trends: [],
            geographicPatterns: [],
            riskAssessment: {},
            predictions: {}
          }
        };
      }

      const totalStations = new Set(stationData.map(d => d.station_id)).size;
      const totalRecords = stationData.length;

      // Date range
      const dates = stationData
        .map(d => d.sample_dt ? new Date(d.sample_dt) : null)
        .filter(date => date && !isNaN(date.getTime()))
        .sort();
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
          high_count: polAValues.filter(val => val > 7).length,
          stdDev: calculateStandardDeviation(polAValues)
        },
        polB: {
          avg: polBValues.reduce((sum, val) => sum + val, 0) / polBValues.length,
          max: Math.max(...polBValues),
          min: Math.min(...polBValues),
          high_count: polBValues.filter(val => val > 7).length,
          stdDev: calculateStandardDeviation(polBValues)
        }
      };

      // Station-level analysis
      const stationGroups = stationData.reduce((groups, record) => {
        if (!groups[record.station_id]) {
          groups[record.station_id] = [];
        }
        groups[record.station_id].push(record);
        return groups;
      }, {});

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
          riskLevel: maxPol > 7 ? 'high' : maxPol > 3 ? 'medium' : 'low',
          variance: calculateVariance(records.map(r => r.pol_a).concat(records.map(r => r.pol_b)))
        };
      });

      // ADVANCED ANALYTICS
      const advancedAnalytics = {
        anomalies: detectAnomalies(stationData, pollutionStats),
        trends: analyzeTrends(stationData),
        geographicPatterns: analyzeGeographicPatterns(stationSummary),
        riskAssessment: assessRisks(stationData, stationSummary),
        predictions: generatePredictions(stationData, pollutionStats)
      };

      return {
        totalStations,
        totalRecords,
        dateRange,
        pollutionStats,
        stationSummary,
        advancedAnalytics
      };
    };

    // Helper function: Calculate standard deviation
    const calculateStandardDeviation = (values) => {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
      return Math.sqrt(variance);
    };

    // Helper function: Calculate variance
    const calculateVariance = (values) => {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    };

    // ADVANCED ANALYTICS FUNCTIONS

    // 1. Anomaly Detection using Z-score method
    const detectAnomalies = (stationData, pollutionStats) => {
      const anomalies = [];
      const zScoreThreshold = 2.5; // Values beyond 2.5 standard deviations are anomalies

      stationData.forEach(record => {
        // Check Pollution A anomalies
        const zScoreA = Math.abs((record.pol_a - pollutionStats.polA.avg) / pollutionStats.polA.stdDev);
        if (zScoreA > zScoreThreshold) {
          anomalies.push({
            stationId: record.station_id,
            stationName: record.station_name,
            date: record.sample_dt ? record.sample_dt.split('T')[0] : 'Unknown',
            pollutant: 'Pollution A',
            value: record.pol_a,
            zScore: zScoreA.toFixed(2),
            severity: zScoreA > 3 ? 'extreme' : 'moderate',
            description: `Pollution A reading of ${record.pol_a} is ${zScoreA.toFixed(1)} standard deviations from normal`
          });
        }

        // Check Pollution B anomalies
        const zScoreB = Math.abs((record.pol_b - pollutionStats.polB.avg) / pollutionStats.polB.stdDev);
        if (zScoreB > zScoreThreshold) {
          anomalies.push({
            stationId: record.station_id,
            stationName: record.station_name,
            date: record.sample_dt ? record.sample_dt.split('T')[0] : 'Unknown',
            pollutant: 'Pollution B',
            value: record.pol_b,
            zScore: zScoreB.toFixed(2),
            severity: zScoreB > 3 ? 'extreme' : 'moderate',
            description: `Pollution B reading of ${record.pol_b} is ${zScoreB.toFixed(1)} standard deviations from normal`
          });
        }
      });

      return anomalies.sort((a, b) => b.zScore - a.zScore).slice(0, 10); // Top 10 anomalies
    };

    // 2. Trend Analysis
    const analyzeTrends = (stationData) => {
      const trends = [];
      
      // Group data by date for temporal analysis
      const dateGroups = stationData.reduce((groups, record) => {
        const date = record.sample_dt ? record.sample_dt.split('T')[0] : 'Unknown';
        if (!groups[date]) groups[date] = [];
        groups[date].push(record);
        return groups;
      }, {});

      const dailyAverages = Object.entries(dateGroups)
        .map(([date, records]) => ({
          date: new Date(date),
          avgPolA: records.reduce((sum, r) => sum + r.pol_a, 0) / records.length,
          avgPolB: records.reduce((sum, r) => sum + r.pol_b, 0) / records.length,
          recordCount: records.length
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      if (dailyAverages.length >= 3) {
        // Detect trends using linear regression slope
        const pollutionATrend = calculateTrendSlope(dailyAverages.map((d, i) => [i, d.avgPolA]));
        const pollutionBTrend = calculateTrendSlope(dailyAverages.map((d, i) => [i, d.avgPolB]));

        if (Math.abs(pollutionATrend) > 0.01) {
          trends.push({
            pollutant: 'Pollution A',
            direction: pollutionATrend > 0 ? 'increasing' : 'decreasing',
            slope: pollutionATrend.toFixed(4),
            significance: Math.abs(pollutionATrend) > 0.05 ? 'high' : 'moderate',
            description: `Pollution A shows a ${pollutionATrend > 0 ? 'rising' : 'declining'} trend over time`
          });
        }

        if (Math.abs(pollutionBTrend) > 0.01) {
          trends.push({
            pollutant: 'Pollution B',
            direction: pollutionBTrend > 0 ? 'increasing' : 'decreasing',
            slope: pollutionBTrend.toFixed(4),
            significance: Math.abs(pollutionBTrend) > 0.05 ? 'high' : 'moderate',
            description: `Pollution B shows a ${pollutionBTrend > 0 ? 'rising' : 'declining'} trend over time`
          });
        }
      }

      return trends;
    };

    // Helper: Calculate trend slope using linear regression
    const calculateTrendSlope = (points) => {
      const n = points.length;
      const sumX = points.reduce((sum, [x, y]) => sum + x, 0);
      const sumY = points.reduce((sum, [x, y]) => sum + y, 0);
      const sumXY = points.reduce((sum, [x, y]) => sum + x * y, 0);
      const sumXX = points.reduce((sum, [x, y]) => sum + x * x, 0);
      
      return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    };

    // 3. Geographic Pattern Analysis
    const analyzeGeographicPatterns = (stationSummary) => {
      const patterns = [];

      // Cluster analysis based on pollution levels and proximity
      const highRiskStations = stationSummary.filter(s => s.riskLevel === 'high');
      const mediumRiskStations = stationSummary.filter(s => s.riskLevel === 'medium');

      // Find pollution hotspots (high-risk stations close to each other)
      const hotspots = [];
      highRiskStations.forEach(station => {
        const nearbyHighRisk = highRiskStations.filter(other => 
          other.id !== station.id &&
          calculateDistance(station.location, other.location) < 50 // Within 50km
        );

        if (nearbyHighRisk.length > 0) {
          hotspots.push({
            center: station,
            nearbyStations: nearbyHighRisk,
            severity: 'high',
            description: `Pollution hotspot detected around ${station.name} with ${nearbyHighRisk.length} nearby high-risk stations`
          });
        }
      });

      // Find isolated high-risk stations
      const isolatedRisks = highRiskStations.filter(station => {
        const nearbyAnyRisk = stationSummary.filter(other =>
          other.id !== station.id &&
          calculateDistance(station.location, other.location) < 25 &&
          (other.riskLevel === 'high' || other.riskLevel === 'medium')
        );
        return nearbyAnyRisk.length === 0;
      });

      patterns.push(...hotspots);
      
      isolatedRisks.forEach(station => {
        patterns.push({
          type: 'isolated_risk',
          station: station,
          severity: 'medium',
          description: `Isolated high-risk station ${station.name} - requires investigation`
        });
      });

      return patterns;
    };

    // Helper: Calculate distance between two coordinates (Haversine formula)
    const calculateDistance = (coord1, coord2) => {
      const R = 6371; // Earth's radius in km
      const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
      const dLon = (coord2.lon - coord1.lon) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    // 4. Risk Assessment
    const assessRisks = (stationData, stationSummary) => {
      const totalHighRisk = stationSummary.filter(s => s.riskLevel === 'high').length;
      const totalMediumRisk = stationSummary.filter(s => s.riskLevel === 'medium').length;
      const exceedanceRate = (stationData.filter(r => r.pol_a > 7 || r.pol_b > 7).length / stationData.length) * 100;

      return {
        overallRisk: exceedanceRate > 30 ? 'critical' : exceedanceRate > 15 ? 'high' : exceedanceRate > 5 ? 'moderate' : 'low',
        exceedanceRate: exceedanceRate.toFixed(1),
        highRiskStations: totalHighRisk,
        mediumRiskStations: totalMediumRisk,
        criticalReadings: stationData.filter(r => r.pol_a > 10 || r.pol_b > 10).length,
        riskFactors: [
          ...(exceedanceRate > 20 ? ['High pollution exceedance rate'] : []),
          ...(totalHighRisk > 3 ? ['Multiple high-risk stations'] : []),
          ...(stationData.some(r => r.pol_a > 15 || r.pol_b > 15) ? ['Extreme pollution readings detected'] : [])
        ]
      };
    };

    // 5. Predictive Analysis
    const generatePredictions = (stationData, pollutionStats) => {
      const predictions = {};

      // Simple trend-based predictions
      const recentData = stationData
        .sort((a, b) => new Date(b.sample_dt).getTime() - new Date(a.sample_dt).getTime())
        .slice(0, Math.min(100, Math.floor(stationData.length * 0.3))); // Last 30% of data or 100 records

      if (recentData.length > 10) {
        const recentAvgA = recentData.reduce((sum, r) => sum + r.pol_a, 0) / recentData.length;
        const recentAvgB = recentData.reduce((sum, r) => sum + r.pol_b, 0) / recentData.length;

        const trendA = recentAvgA > pollutionStats.polA.avg ? 'increasing' : 'decreasing';
        const trendB = recentAvgB > pollutionStats.polB.avg ? 'increasing' : 'decreasing';

        predictions.shortTerm = {
          pollutionA: {
            trend: trendA,
            projectedLevel: recentAvgA.toFixed(2),
            confidence: recentData.length > 50 ? 'high' : 'moderate'
          },
          pollutionB: {
            trend: trendB,
            projectedLevel: recentAvgB.toFixed(2),
            confidence: recentData.length > 50 ? 'high' : 'moderate'
          }
        };

        // Risk predictions
        const riskProbability = (recentData.filter(r => r.pol_a > 7 || r.pol_b > 7).length / recentData.length) * 100;
        predictions.riskForecast = {
          exceedanceProbability: riskProbability.toFixed(1),
          riskLevel: riskProbability > 40 ? 'high' : riskProbability > 20 ? 'moderate' : 'low',
          recommendation: riskProbability > 30 ? 'Implement immediate monitoring protocols' : 'Continue regular monitoring'
        };
      }

      return predictions;
    };

    const context = buildAdvancedDataContext(stationData);
    
    const systemPrompt = `You are an expert environmental data analyst assistant with advanced analytics capabilities. You have access to pollution monitoring data from ${context.totalStations} stations with ${context.totalRecords} records.

BASIC CONTEXT:
- Data range: ${context.dateRange.start} to ${context.dateRange.end}
- Pollution A: avg=${context.pollutionStats.polA.avg.toFixed(2)}, max=${context.pollutionStats.polA.max}, std=${context.pollutionStats.polA.stdDev?.toFixed(2)}, high readings=${context.pollutionStats.polA.high_count}
- Pollution B: avg=${context.pollutionStats.polB.avg.toFixed(2)}, max=${context.pollutionStats.polB.max}, std=${context.pollutionStats.polB.stdDev?.toFixed(2)}, high readings=${context.pollutionStats.polB.high_count}

ADVANCED ANALYTICS:
${context.advancedAnalytics?.anomalies?.length > 0 ? `
🚨 ANOMALIES DETECTED (${context.advancedAnalytics.anomalies.length}):
${context.advancedAnalytics.anomalies.slice(0, 3).map(a => `- ${a.stationName}: ${a.pollutant} = ${a.value} (${a.severity} anomaly, Z-score: ${a.zScore})`).join('\n')}` : ''}

${context.advancedAnalytics?.trends?.length > 0 ? `
📈 TRENDS IDENTIFIED (${context.advancedAnalytics.trends.length}):
${context.advancedAnalytics.trends.map(t => `- ${t.pollutant}: ${t.direction} trend (${t.significance} significance)`).join('\n')}` : ''}

${context.advancedAnalytics?.geographicPatterns?.length > 0 ? `
🗺️ GEOGRAPHIC PATTERNS (${context.advancedAnalytics.geographicPatterns.length}):
${context.advancedAnalytics.geographicPatterns.slice(0, 2).map(p => `- ${p.description}`).join('\n')}` : ''}

${context.advancedAnalytics?.riskAssessment ? `
⚠️ RISK ASSESSMENT:
- Overall Risk Level: ${context.advancedAnalytics.riskAssessment.overallRisk}
- Exceedance Rate: ${context.advancedAnalytics.riskAssessment.exceedanceRate}%
- High-Risk Stations: ${context.advancedAnalytics.riskAssessment.highRiskStations}
- Critical Readings: ${context.advancedAnalytics.riskAssessment.criticalReadings}` : ''}

${context.advancedAnalytics?.predictions?.shortTerm ? `
🔮 PREDICTIONS:
- Pollution A Trend: ${context.advancedAnalytics.predictions.shortTerm.pollutionA.trend} (confidence: ${context.advancedAnalytics.predictions.shortTerm.pollutionA.confidence})
- Pollution B Trend: ${context.advancedAnalytics.predictions.shortTerm.pollutionB.trend} (confidence: ${context.advancedAnalytics.predictions.shortTerm.pollutionB.confidence})
- Risk Forecast: ${context.advancedAnalytics.predictions.riskForecast?.riskLevel} risk (${context.advancedAnalytics.predictions.riskForecast?.exceedanceProbability}% exceedance probability)` : ''}

HIGH-RISK STATIONS (pollution >7):
${context.stationSummary
  .filter(s => s.riskLevel === 'high')
  .map(s => `- ${s.name} (ID: ${s.id}): PolA=${s.avgPolA.toFixed(1)}, PolB=${s.avgPolB.toFixed(1)}`)
  .join('\n')}

You can interact with the map by including mapCommands in your response. Available commands:
- focus_station: {stationId: "123"} - Focus map on specific station
- highlight_stations: {stationIds: ["123", "456"]} - Highlight multiple stations
- filter_data: {polA_min: 5, polB_min: 3, date_from: "2025-01-01"} - Apply data filters
- set_zoom: {level: 10, center: {lat: -23.5, lon: -46.6}} - Set map zoom and center

ADVANCED CAPABILITIES:
1. Anomaly Detection: Identify unusual readings using statistical analysis (Z-scores >2.5)
2. Trend Analysis: Detect pollution trends using linear regression on temporal data
3. Geographic Pattern Recognition: Find pollution hotspots and isolated high-risk areas
4. Risk Assessment: Calculate overall environmental risk levels and exceedance rates
5. Predictive Analytics: Generate short-term forecasts and risk predictions

INSTRUCTIONS:
1. Use the advanced analytics data to provide sophisticated insights
2. Reference specific anomalies, trends, and patterns when relevant
3. Include map commands to visualize findings (focus on anomalous stations, highlight hotspots)
4. Provide actionable recommendations based on risk assessments and predictions
5. Be proactive about suggesting investigations for anomalies and patterns
6. Use professional environmental terminology while remaining accessible

Respond in JSON format: {"message": "your response", "mapCommands": [optional map commands]}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"message": "I apologize, but I encountered an error processing your request."}');
    
    res.json({
      message: result.message,
      mapCommands: result.mapCommands || [],
      data: context
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Return fallback response
    const fallbackStationData = req.body.stationData || [];
    const totalStations = fallbackStationData.length > 0 ? new Set(fallbackStationData.map(d => d.station_id)).size : 0;
    const totalRecords = fallbackStationData.length;
    
    res.json({
      message: totalRecords === 0 
        ? "I don't have any data to analyze yet. Please import some CSV data first, and I'll be able to provide detailed insights about pollution patterns and trends."
        : `I apologize, but I'm experiencing some technical difficulties with my AI analysis. However, I can tell you that you have ${totalRecords} records from ${totalStations} stations. Please try rephrasing your question, and I'll do my best to help.`,
      mapCommands: [],
      data: null
    });
  }
});

// Database API endpoints

// Import CSV data and save to database
app.post('/api/data/import', async (req, res) => {
  try {
    const { csvData } = req.body;
    
    if (!csvData || !Array.isArray(csvData)) {
      return res.status(400).json({ error: 'csvData array is required' });
    }

    // Clear existing data
    await db.delete(pollutionRecords);
    await db.delete(stations);

    // Extract unique stations
    const uniqueStations = new Map();
    csvData.forEach(record => {
      if (record.station_id && !uniqueStations.has(record.station_id)) {
        uniqueStations.set(record.station_id, {
          stationId: record.station_id,
          stationName: record.station_name || `Station ${record.station_id}`,
          latitude: parseFloat(record.latitude) || 0,
          longitude: parseFloat(record.longitude) || 0,
          location: record.location || ''
        });
      }
    });

    // Insert stations
    if (uniqueStations.size > 0) {
      await db.insert(stations).values(Array.from(uniqueStations.values()));
    }

    // Insert pollution records
    const records = csvData
      .filter(record => record.station_id && record.pol_a !== undefined && record.pol_b !== undefined)
      .map(record => ({
        stationId: record.station_id,
        sampleDate: record.sample_dt ? new Date(record.sample_dt) : new Date(),
        polA: parseFloat(record.pol_a) || 0,
        polB: parseFloat(record.pol_b) || 0
      }));

    if (records.length > 0) {
      await db.insert(pollutionRecords).values(records);
    }

    res.json({ 
      success: true, 
      message: `Imported ${uniqueStations.size} stations and ${records.length} pollution records`,
      stationsCount: uniqueStations.size,
      recordsCount: records.length
    });

  } catch (error) {
    console.error('Database import error:', error);
    res.status(500).json({ error: 'Failed to import data to database' });
  }
});

// Get all data from database
app.get('/api/data/records', async (req, res) => {
  try {
    // Fetch all records with station information
    const records = await db
      .select({
        id: pollutionRecords.id,
        station_id: pollutionRecords.stationId,
        station_name: stations.stationName,
        latitude: stations.latitude,
        longitude: stations.longitude,
        location: stations.location,
        sample_dt: pollutionRecords.sampleDate,
        pol_a: pollutionRecords.polA,
        pol_b: pollutionRecords.polB,
        created_at: pollutionRecords.createdAt
      })
      .from(pollutionRecords)
      .leftJoin(stations, eq(pollutionRecords.stationId, stations.stationId))
      .orderBy(pollutionRecords.sampleDate);

    res.json({ 
      success: true, 
      data: records,
      totalRecords: records.length,
      totalStations: new Set(records.map(r => r.station_id)).size
    });

  } catch (error) {
    console.error('Database fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch data from database' });
  }
});

// Clear all data from database
app.delete('/api/data/clear', async (req, res) => {
  try {
    const deletedRecords = await db.delete(pollutionRecords);
    const deletedStations = await db.delete(stations);
    
    res.json({ 
      success: true, 
      message: 'All data cleared from database',
      deletedRecords: deletedRecords,
      deletedStations: deletedStations
    });

  } catch (error) {
    console.error('Database clear error:', error);
    res.status(500).json({ error: 'Failed to clear database' });
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🤖 WebGIS AI Server running on port ${port}`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Missing!'}`);
});

module.exports = app;