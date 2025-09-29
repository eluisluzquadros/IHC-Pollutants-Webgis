import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
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
}

export default function ModernSidebar({
  children,
  dataManagementContent,
  dashboardContent,
  chatBotContent,
  filterContent,
  layerControlContent,
  stationCount = 0,
  recordCount = 0
}: ModernSidebarProps) {
  const [activeTab, setActiveTab] = useState('chat'); // Start with AI Assistant
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed top-6 left-6 z-50 lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              size="sm" 
              className="btn-professional btn-professional-primary glass-professional shadow-lg"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-md p-0 border-0">
            <SidebarContent
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              dataManagementContent={dataManagementContent}
              dashboardContent={dashboardContent}
              chatBotContent={chatBotContent}
              filterContent={filterContent}
              layerControlContent={layerControlContent}
              stationCount={stationCount}
              recordCount={recordCount}
              onClose={() => setIsOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <div className="sidebar-professional animate-professional-slide-in">
          <SidebarContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            dataManagementContent={dataManagementContent}
            dashboardContent={dashboardContent}
            chatBotContent={chatBotContent}
            filterContent={filterContent}
            layerControlContent={layerControlContent}
            stationCount={stationCount}
            recordCount={recordCount}
          />
        </div>
      </div>
    </>
  );
}

interface SidebarContentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dataManagementContent: React.ReactNode;
  dashboardContent: React.ReactNode;
  chatBotContent: React.ReactNode;
  filterContent: React.ReactNode;
  layerControlContent: React.ReactNode;
  stationCount: number;
  recordCount: number;
  onClose?: () => void;
}

function SidebarContent({
  activeTab,
  setActiveTab,
  dataManagementContent,
  dashboardContent,
  chatBotContent,
  filterContent,
  layerControlContent,
  stationCount,
  recordCount,
  onClose
}: SidebarContentProps) {
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