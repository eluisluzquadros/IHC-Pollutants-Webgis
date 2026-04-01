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
import { AIService } from '@/services/aiService';
import { useMapCommands } from '@/contexts/MapCommandContext';

const aiService = new AIService();

interface ChatBotProps {
  stationData: StationData[];
  onClose?: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  data?: any;
}

export default function ChatBot({ stationData, onClose }: ChatBotProps) {
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
        content: stationData.length === 0 
          ? `Olá! Seja bem-vindo à Envibase. Eu sou o Envibase AI Assistant. Como ainda não carregamos dados de projetos, posso te explicar como nossa plataforma ajuda a gerenciar dados ambientais, realizar análises espaciais e gerar relatórios automáticos. O que você gostaria de explorar primeiro?`
          : `Olá! Eu sou o Envibase AI Assistant, seu assistente especialista para análise de dados ambientais. Tenho conhecimento avançado das estações de monitoramento e posso interagir com o mapa para mostrar insights. Pergunte-me algo como "quais estações estão com poluição crítica?" ou "mostre a tendência temporal" e eu ajudarei a visualizar os resultados.`,
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
      if (input.includes('onboarding') || input.includes('como funciona') || input.includes('ajuda')) {
        return "Na Envibase, você pode importar dados CSV de sensores ambientais, visualizar dispersão de poluentes em mapas Intercom, criar dashboards de análise e usar IA para detectar anomalias automaticamente. Deseja saber mais sobre a integração com PostGIS?";
      }
      return "Para que eu possa realizar análises técnicas, é necessário acessar a plataforma e carregar um dataset. Enquanto isso, posso tirar dúvidas sobre as funcionalidades da Envibase como o Envibase AI Assistant e a gestão de camadas cartográficas.";
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
• ${analysis.highPolACount} high Pollution A readings (${(analysis.highPolACount / stationData.length * 100).toFixed(1)}%)
• ${analysis.highPolBCount} high Pollution B readings (${(analysis.highPolBCount / stationData.length * 100).toFixed(1)}%)

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
      const response = await aiService.generateResponse(currentInput, stationData);

      if (response.mapCommands && response.mapCommands.length > 0) {
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

      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: stationData.length === 0
          ? "Desculpe, ocorreu um erro ao processar sua pergunta. Como estamos no modo de onboarding, posso te dizer que a Envibase é excelente para gestão de dados ambientais. Tente perguntar sobre 'como funciona' ou 'funcionalidades'."
          : "Desculpe, tive um problema ao analisar esses dados. Tente reformular sua pergunta ou verifique a conexão.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickActions = [
    { label: 'O que é a Envibase?', query: 'O que é a Envibase?' },
    { label: 'Funcionalidades', query: 'Quais são as principais funcionalidades?' },
    { label: 'Como importar dados?', query: 'Como faço para importar meus dados?' },
    { label: 'AI Assistant', query: 'Como o Envibase AI Assistant funciona?' }
  ];

  return (
    <div className="h-full flex flex-col bg-white/95 dark:bg-[#0A192F]/95 backdrop-blur-2xl border border-landing-navy/15 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_rgba(10,25,47,0.15)] transition-all duration-700 ring-1 ring-white/50 dark:ring-white/5">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-landing-navy/[0.03] dark:border-white/5 bg-white/50 dark:bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-landing-primary to-blue-400 flex items-center justify-center text-white shadow-lg shadow-landing-primary/20 relative group">
            <Bot size={24} className="group-hover:scale-110 transition-transform duration-500" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0A192F] shadow-sm animate-pulse" />
          </div>
          <div>
            <h3 className="text-landing-navy dark:text-white font-bold text-[15px] tracking-tight">
              Envibase AI Assistant
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <p className="text-landing-navy/40 dark:text-white/40 text-[10px] uppercase tracking-[0.2em] font-black">Intelligence Engine</p>
            </div>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-landing-navy/5 dark:hover:bg-white/10 flex items-center justify-center text-landing-navy/40 dark:text-white/60 hover:text-landing-navy dark:hover:text-white transition-all transform hover:rotate-90 duration-300"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-professional min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'bot' && (
              <div className="w-8 h-8 rounded-lg bg-landing-navy/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                <Bot className="w-4 h-4 text-landing-primary" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                message.type === 'user'
                  ? 'bg-landing-primary text-white rounded-tr-none'
                  : 'bg-landing-navy/5 dark:bg-white/10 text-landing-navy dark:text-white rounded-tl-none border border-landing-navy/5 dark:border-white/5'
              }`}
            >
              <div className="whitespace-pre-wrap text-[13px] leading-relaxed font-medium">
                {message.content}
              </div>
              <div className={`text-[9px] mt-2 font-bold tracking-wider opacity-40 uppercase ${
                message.type === 'user' ? 'text-white' : 'text-landing-navy dark:text-white'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {message.type === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-landing-primary/10 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm font-bold text-landing-primary">
                <User size={16} />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-landing-navy/5 dark:bg-white/5 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot className="w-4 h-4 text-landing-primary" />
            </div>
            <div className="bg-landing-navy/5 dark:bg-white/5 rounded-2xl px-5 py-4 border border-landing-navy/5 dark:border-white/5">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-landing-primary rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-landing-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-1.5 h-1.5 bg-landing-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Footer Area */}
      <div className="p-5 bg-landing-navy/[0.01] dark:bg-white/[0.01] border-t border-landing-navy/[0.03] dark:border-white/5 space-y-4 shrink-0 backdrop-blur-sm">
        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300">
            <p className="text-[10px] font-black text-landing-navy/20 dark:text-white/20 uppercase tracking-[0.2em] mb-3 ml-1">Sugestões rápidas</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => setInput(action.query)}
                  className="bg-white/70 dark:bg-white/5 hover:bg-landing-primary hover:text-white border border-landing-navy/5 dark:border-white/10 text-landing-navy/60 dark:text-white/70 px-4 py-2 rounded-xl text-[11px] font-bold transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="flex gap-2 relative group items-end pt-1">
          <div className="relative flex-1 min-h-[56px] bg-white dark:bg-landing-navy/20 rounded-2xl border border-landing-navy/10 dark:border-white/10 shadow-sm group-focus-within:border-landing-primary/30 group-focus-within:ring-4 group-focus-within:ring-landing-primary/5 transition-all duration-500 overflow-hidden">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Pergunte sobre gestão ambiental..."
              className="w-full bg-transparent text-landing-navy dark:text-white placeholder:text-landing-navy/30 dark:placeholder:text-white/20 focus:outline-none p-4 pr-16 text-[14px] leading-relaxed resize-none h-[56px] max-h-[140px] custom-scrollbar"
              disabled={isTyping}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-2 bottom-2 w-10 h-10 bg-landing-primary text-white rounded-xl flex items-center justify-center hover:bg-blue-600 active:scale-90 disabled:grayscale disabled:opacity-30 transition-all shadow-lg shadow-landing-primary/20 z-10"
            >
              {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send size={18} className="ml-0.5" />}
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between px-1 text-[9px] text-landing-navy/20 dark:text-white/20 font-black uppercase tracking-[0.2em] pt-1">
          <div className="flex items-center gap-2">
            <Activity size={10} className="text-landing-primary/40" />
            {stationData.length === 0 ? "Onboarding" : `${stationData.length} Pontos`}
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-500/50" />
            Envibase OS 1.3
          </div>
        </div>
      </div>
    </div>
  );
}