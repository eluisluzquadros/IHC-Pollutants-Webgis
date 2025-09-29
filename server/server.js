const express = require('express');
const cors = require('cors');
const OpenAI = require('openai').default;

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS for Replit environment
app.use(cors({
  origin: ['http://localhost:5000', process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null].filter(Boolean),
  credentials: true
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

    // Build context from station data
    const buildDataContext = (stationData) => {
      if (!stationData || stationData.length === 0) {
        return {
          totalStations: 0,
          totalRecords: 0,
          dateRange: { start: '', end: '' },
          pollutionStats: {
            polA: { avg: 0, max: 0, min: 0, high_count: 0 },
            polB: { avg: 0, max: 0, min: 0, high_count: 0 }
          },
          stationSummary: []
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
          riskLevel: maxPol > 7 ? 'high' : maxPol > 3 ? 'medium' : 'low'
        };
      });

      return {
        totalStations,
        totalRecords,
        dateRange,
        pollutionStats,
        stationSummary
      };
    };

    const context = buildDataContext(stationData);
    
    const systemPrompt = `You are an expert environmental data analyst assistant. You have access to pollution monitoring data from ${context.totalStations} stations with ${context.totalRecords} records.

CONTEXT:
- Data range: ${context.dateRange.start} to ${context.dateRange.end}
- Pollution A: avg=${context.pollutionStats.polA.avg.toFixed(2)}, max=${context.pollutionStats.polA.max}, high readings=${context.pollutionStats.polA.high_count}
- Pollution B: avg=${context.pollutionStats.polB.avg.toFixed(2)}, max=${context.pollutionStats.polB.max}, high readings=${context.pollutionStats.polB.high_count}

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

INSTRUCTIONS:
1. Provide helpful, data-driven insights in a conversational tone
2. Reference specific stations, dates, and values when possible
3. When relevant, include mapCommands to visualize your response
4. For questions about specific stations or geographic areas, always include map interactions
5. Be proactive - suggest related insights the user might find interesting

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
    const totalStations = stationData ? new Set(stationData.map(d => d.station_id)).size : 0;
    const totalRecords = stationData ? stationData.length : 0;
    
    res.json({
      message: totalRecords === 0 
        ? "I don't have any data to analyze yet. Please import some CSV data first, and I'll be able to provide detailed insights about pollution patterns and trends."
        : `I apologize, but I'm experiencing some technical difficulties with my AI analysis. However, I can tell you that you have ${totalRecords} records from ${totalStations} stations. Please try rephrasing your question, and I'll do my best to help.`,
      mapCommands: [],
      data: null
    });
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🤖 WebGIS AI Server running on port ${port}`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Missing!'}`);
});

module.exports = app;