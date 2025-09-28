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
  const [activeTab, setActiveTab] = useState('dashboard');
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
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        {/* Professional Header */}
        <div className="sidebar-professional-header">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Map className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Control Panel</h2>
                <p className="text-sm text-blue-100 opacity-90">Environmental Data Platform</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-white">
                  <Activity className="w-4 h-4" />
                  <div>
                    <div className="text-lg font-bold">{stationCount}</div>
                    <div className="text-xs opacity-90">Stations</div>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-white">
                  <TrendingUp className="w-4 h-4" />
                  <div>
                    <div className="text-lg font-bold">{recordCount.toLocaleString()}</div>
                    <div className="text-xs opacity-90">Records</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose} 
              className="text-white hover:bg-white/20 ml-4"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Professional Tab Navigation */}
        <div className="tabs-professional">
          <TabsList className="grid grid-cols-5 gap-0 p-0 bg-transparent h-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id}
                  className="tab-professional"
                  title={tab.description}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Professional Tab Content */}
        <div className="flex-1 overflow-hidden sidebar-professional-content">
          {tabs.map((tab) => (
            <TabsContent 
              key={tab.id}
              value={tab.id} 
              className="h-full m-0 overflow-hidden"
            >
              <div className="h-full overflow-y-auto scrollbar-professional sidebar-professional-section">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <tab.icon className="w-5 h-5 text-blue-600" />
                    <h3 className="text-professional-heading">{tab.label}</h3>
                  </div>
                  <p className="text-professional-caption">{tab.description}</p>
                </div>
                {tab.content}
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}