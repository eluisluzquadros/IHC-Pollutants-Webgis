import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  BarChart3,
  Lightbulb,
  Activity,
  Loader2
} from 'lucide-react';
import { StationData } from '@/utils/csvImporter';
import { openaiService } from '@/services/openaiService';
import { useMapCommands } from '@/contexts/MapCommandContext';

interface ChatBotProps {
  stationData: StationData[];
}

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  data?: any;
}

export default function ChatBot({ stationData }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { executeCommands } = useMapCommands();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        type: 'bot',
        content: `Hello! I'm your AI assistant for environmental data analysis. I have advanced knowledge of your pollution monitoring data and can interact with the map to show you insights. Ask me questions like "which station has the highest pollution?" or "show me pollution trends over time" and I'll analyze the data and help visualize the results on the map.`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [stationData.length]);

  // Analyze data and generate insights
  const analyzeData = () => {
    if (stationData.length === 0) return null;

    const totalStations = new Set(stationData.map(d => d.station_id)).size;
    const avgPolA = stationData.reduce((sum, d) => sum + d.pol_a, 0) / stationData.length;
    const avgPolB = stationData.reduce((sum, d) => sum + d.pol_b, 0) / stationData.length;
    const maxPolA = Math.max(...stationData.map(d => d.pol_a));
    const maxPolB = Math.max(...stationData.map(d => d.pol_b));
    
    // Find stations with highest pollution
    const highestPolAStation = stationData.find(d => d.pol_a === maxPolA);
    const highestPolBStation = stationData.find(d => d.pol_b === maxPolB);
    
    // Count high pollution readings (>7)
    const highPolACount = stationData.filter(d => d.pol_a > 7).length;
    const highPolBCount = stationData.filter(d => d.pol_b > 7).length;
    
    return {
      totalStations,
      totalRecords: stationData.length,
      avgPolA: avgPolA.toFixed(2),
      avgPolB: avgPolB.toFixed(2),
      maxPolA,
      maxPolB,
      highestPolAStation,
      highestPolBStation,
      highPolACount,
      highPolBCount,
      highPollutionPercentage: ((highPolACount + highPolBCount) / (stationData.length * 2) * 100).toFixed(1)
    };
  };

  const generateResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    const analysis = analyzeData();
    
    if (!analysis) {
      return "I don't have any data to analyze yet. Please import some CSV data first, and I'll be able to provide detailed insights about pollution patterns and trends.";
    }

    // Pattern matching for different types of questions
    if (input.includes('summary') || input.includes('overview') || input.includes('general')) {
      return `Here's a comprehensive overview of your environmental data:

📊 **Data Summary:**
• Total monitoring stations: ${analysis.totalStations}
• Total data records: ${analysis.totalRecords.toLocaleString()}
• Average Pollution A: ${analysis.avgPolA} ${stationData[0]?.unit || 'units'}
• Average Pollution B: ${analysis.avgPolB} ${stationData[0]?.unit || 'units'}

🚨 **Pollution Levels:**
• High pollution readings: ${analysis.highPollutionPercentage}% of all measurements
• Highest Pollution A: ${analysis.maxPolA} at ${analysis.highestPolAStation?.station_name}
• Highest Pollution B: ${analysis.maxPolB} at ${analysis.highestPolBStation?.station_name}

The data shows ${analysis.highPolACount + analysis.highPolBCount} readings above the high pollution threshold (>7 units).`;
    }

    if (input.includes('highest') || input.includes('maximum') || input.includes('worst')) {
      return `🔴 **Highest Pollution Levels Detected:**

**Pollution Type A:**
• Maximum level: ${analysis.maxPolA} ${stationData[0]?.unit || 'units'}
• Location: ${analysis.highestPolAStation?.station_name}
• Station ID: ${analysis.highestPolAStation?.station_id}
• Date: ${analysis.highestPolAStation?.sample_dt}

**Pollution Type B:**
• Maximum level: ${analysis.maxPolB} ${stationData[0]?.unit || 'units'}
• Location: ${analysis.highestPolBStation?.station_name}
• Station ID: ${analysis.highestPolBStation?.station_id}

These stations require immediate attention and monitoring.`;
    }

    if (input.includes('average') || input.includes('mean') || input.includes('typical')) {
      return `📈 **Average Pollution Levels:**

• **Pollution A Average:** ${analysis.avgPolA} ${stationData[0]?.unit || 'units'}
• **Pollution B Average:** ${analysis.avgPolB} ${stationData[0]?.unit || 'units'}

**Interpretation:**
${parseFloat(analysis.avgPolA) > 7 ? '⚠️ Pollution A levels are above the high threshold (>7)' : parseFloat(analysis.avgPolA) > 3 ? '🟡 Pollution A levels are in the medium range (3-7)' : '✅ Pollution A levels are within acceptable limits (<3)'}

${parseFloat(analysis.avgPolB) > 7 ? '⚠️ Pollution B levels are above the high threshold (>7)' : parseFloat(analysis.avgPolB) > 3 ? '🟡 Pollution B levels are in the medium range (3-7)' : '✅ Pollution B levels are within acceptable limits (<3)'}`;
    }

    if (input.includes('station') || input.includes('location')) {
      const stationNames = [...new Set(stationData.map(d => d.station_name))].slice(0, 5);
      return `🗺️ **Station Information:**

You have data from ${analysis.totalStations} monitoring stations:

${stationNames.map(name => `• ${name}`).join('\n')}
${analysis.totalStations > 5 ? `\n...and ${analysis.totalStations - 5} more stations` : ''}

Each station provides pollution measurements for both Type A and Type B pollutants. You can filter data by specific stations using the Filters tab.`;
    }

    if (input.includes('trend') || input.includes('pattern') || input.includes('time')) {
      const dates = stationData.map(d => new Date(d.sample_dt)).sort();
      const earliestDate = dates[0]?.toLocaleDateString();
      const latestDate = dates[dates.length - 1]?.toLocaleDateString();
      
      return `📅 **Temporal Analysis:**

• **Data Range:** ${earliestDate} to ${latestDate}
• **Total Records:** ${analysis.totalRecords.toLocaleString()}

**Pollution Trends:**
• ${analysis.highPolACount} high Pollution A readings (${(analysis.highPolACount/stationData.length*100).toFixed(1)}%)
• ${analysis.highPolBCount} high Pollution B readings (${(analysis.highPolBCount/stationData.length*100).toFixed(1)}%)

For detailed temporal analysis, check the Analytics tab for time-series charts and seasonal patterns.`;
    }

    if (input.includes('help') || input.includes('what can you do')) {
      return `🤖 **I can help you with:**

📊 **Data Analysis:**
• "Give me a summary" - Overall data overview
• "What are the highest pollution levels?" - Find worst cases
• "Show me average levels" - Statistical analysis
• "Tell me about trends" - Temporal patterns

🗺️ **Spatial Analysis:**
• "Which stations have problems?" - Station-specific insights
• "Where is pollution highest?" - Geographic hotspots

📈 **Insights:**
• "What should I focus on?" - Priority recommendations
• "Are levels dangerous?" - Risk assessment

Just ask me anything about your environmental data!`;
    }

    if (input.includes('recommend') || input.includes('suggest') || input.includes('focus')) {
      const criticalStations = stationData.filter(d => d.pol_a > 7 || d.pol_b > 7);
      const uniqueCriticalStations = [...new Set(criticalStations.map(d => d.station_name))];
      
      return `💡 **Recommendations:**

**Immediate Actions:**
${uniqueCriticalStations.length > 0 ? 
  `• Focus on ${uniqueCriticalStations.length} stations with critical pollution levels:\n${uniqueCriticalStations.slice(0, 3).map(name => `  - ${name}`).join('\n')}` :
  '• All stations are within acceptable limits - continue regular monitoring'
}

**Analysis Priorities:**
• Use the heatmap to identify pollution density patterns
• Check the Analytics tab for detailed charts and trends
• Apply filters to focus on specific time periods or pollution levels
• Export filtered data for further analysis

**Monitoring Strategy:**
• Set up alerts for readings above ${Math.max(parseFloat(analysis.avgPolA), parseFloat(analysis.avgPolB)) + 2} units
• Increase sampling frequency at high-risk locations
• Correlate with weather and industrial activity data`;
    }

    // Default response with data context
    return `I understand you're asking about "${userInput}". Based on your current dataset of ${analysis.totalRecords.toLocaleString()} records from ${analysis.totalStations} stations:

• Average pollution levels are ${analysis.avgPolA} (Type A) and ${analysis.avgPolB} (Type B)
• ${analysis.highPollutionPercentage}% of readings show high pollution levels

Try asking me:
• "Give me a summary" for a complete overview
• "What are the highest levels?" for critical areas
• "Show me recommendations" for action items
• "Help" for more options

What specific aspect would you like to explore?`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      // Generate AI response using OpenAI
      const response = await openaiService.generateResponse(currentInput, stationData);
      
      // Execute map commands if provided
      if (response.mapCommands && response.mapCommands.length > 0) {
        console.log('🎯 Executing map commands:', response.mapCommands);
        executeCommands(response.mapCommands);
      }
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.message,
        timestamp: new Date(),
        data: response.data
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('AI Service Error:', error);
      
      // Fallback response
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: stationData.length === 0 
          ? "I don't have any data to analyze yet. Please import some CSV data first, and I'll be able to provide detailed insights about pollution patterns and trends."
          : `I apologize, but I'm experiencing some technical difficulties with my AI analysis. However, I can tell you that you have ${stationData.length} records from ${new Set(stationData.map(d => d.station_id)).size} stations. Please try rephrasing your question, and I'll do my best to help.`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: 'Data Summary', query: 'Give me a data summary' },
    { label: 'Highest Levels', query: 'What are the highest pollution levels?' },
    { label: 'Recommendations', query: 'What should I focus on?' },
    { label: 'Station Info', query: 'Tell me about the stations' }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Chat Messages */}
      <div className="flex-1 min-h-[400px] max-h-[600px] overflow-y-auto scrollbar-professional space-y-4 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </div>
              <div className={`text-xs mt-2 opacity-70 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
            
            {message.type === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="mb-4">
          <p className="text-professional-caption mb-3">Quick actions:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setInput(action.query)}
                className="btn-professional btn-professional-outline text-xs h-auto py-2"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me about your environmental data..."
          className="input-professional flex-1"
          disabled={isTyping}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="btn-professional btn-professional-primary"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Data Status */}
      <div className="mt-3 flex items-center justify-center">
        <Badge variant="secondary" className="status-professional status-professional-info text-xs">
          <Activity className="w-3 h-3 mr-1" />
          {stationData.length > 0 ? `Analyzing ${stationData.length.toLocaleString()} records` : 'No data loaded'}
        </Badge>
      </div>
    </div>
  );
}