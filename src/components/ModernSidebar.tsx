import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Download,
  FileText,
  BarChart3,
  MessageSquare,
  Filter,
  Settings,
  Map,
  X,
  Activity,
  TrendingUp,
  Database,
  Layers
} from 'lucide-react';

interface ModernSidebarProps {
  children?: React.ReactNode;
  dataManagementContent: React.ReactNode;
  dashboardContent: React.ReactNode;
  chatBotContent: React.ReactNode;
  filterContent: React.ReactNode;
  layerControlContent: React.ReactNode;
  stationCount?: number;
  recordCount?: number;
  onClose?: () => void;
}

export default function ModernSidebar({
  children,
  dataManagementContent,
  dashboardContent,
  chatBotContent,
  filterContent,
  layerControlContent,
  stationCount = 0,
  recordCount = 0,
  onClose
}: ModernSidebarProps) {
  const [activeTab, setActiveTab] = useState('chat'); // Start with AI Assistant

  const tabs = [
    {
      id: 'dashboard',
      label: 'Analytics',
      icon: BarChart3,
      content: dashboardContent,
      description: 'Data insights and charts'
    },
    {
      id: 'chat',
      label: 'AI Assistant',
      icon: MessageSquare,
      content: chatBotContent,
      description: 'Intelligent data analysis'
    },
    {
      id: 'filter',
      label: 'Filters',
      icon: Filter,
      content: filterContent,
      description: 'Data filtering controls'
    },
    {
      id: 'data',
      label: 'Data',
      icon: Database,
      content: dataManagementContent,
      description: 'Import and export data'
    },
    {
      id: 'layers',
      label: 'Layers',
      icon: Layers,
      content: layerControlContent,
      description: 'Map visualization controls'
    }
  ];

  return (
    <div className="h-full flex flex-col bg-slate-950/20 backdrop-blur-xl border-r border-white/5 shadow-2xl overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        {/* Mobile Close Button */}
        {onClose && (
          <div className="md:hidden flex justify-end p-4 border-b border-white/10 bg-black/40">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Compact Tab Navigation - Premium Dark Look */}
        <div className="border-b border-white/10 bg-black/40 backdrop-blur-md">
          <TabsList className="grid grid-cols-5 gap-0 p-1 bg-transparent h-auto w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col items-center gap-1.5 py-3 px-1 text-gray-400 hover:text-emerald-400 data-[state=active]:text-emerald-400 data-[state=active]:bg-white/5 data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:w-[40%] data-[state=active]:after:h-0.5 data-[state=active]:after:bg-emerald-500 data-[state=active]:after:shadow-[0_0_8px_rgba(16,185,129,0.8)] transition-all duration-300 relative group"
                  title={tab.description}
                >
                  <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Optimized Tab Content - Scrollable Glass Area */}
        <div className="flex-1 overflow-hidden relative">
          {/* Subtle background glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[100px] rounded-full"></div>
            <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[100px] rounded-full"></div>
          </div>

          {tabs.map((tab) => (
            <TabsContent
              key={tab.id}
              value={tab.id}
              className="h-full m-0 overflow-hidden outline-none data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 duration-300"
            >
              <div className="h-full overflow-y-auto scrollbar-professional p-6 pb-20 relative z-10">
                {tab.content}
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}