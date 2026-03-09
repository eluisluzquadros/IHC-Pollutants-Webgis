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
    <div className="h-full flex flex-col bg-white">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        {/* Mobile Close Button */}
        {onClose && (
          <div className="md:hidden flex justify-end p-4 border-b border-gray-200">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Compact Tab Navigation */}
        <div className="border-b border-gray-200 bg-gray-50">
          <TabsList className="grid grid-cols-5 gap-0 p-0 bg-transparent h-auto w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col items-center gap-1 py-3 px-2 text-gray-600 hover:text-gray-900 hover:bg-white data-[state=active]:text-blue-600 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-all duration-200"
                  title={tab.description}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Optimized Tab Content */}
        <div className="flex-1 overflow-hidden">
          {tabs.map((tab) => (
            <TabsContent 
              key={tab.id}
              value={tab.id} 
              className="h-full m-0 overflow-hidden"
            >
              <div className="h-full overflow-y-auto scrollbar-professional p-4">
                {tab.content}
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}