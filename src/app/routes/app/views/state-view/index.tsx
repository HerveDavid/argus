import React, { useState } from 'react';
import EditorLayout from '@/components/layouts/editor';
import { useSubstations } from '@/features/network/hooks/use-substations';
import { useSubstationDetails } from '@/features/network/hooks/use-substation-details';
import { NetworkExplorer } from '@/features/network/components/network-explorer';
import { SubstationViewer } from '@/features/network/components/network-explorer/substation-viewer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { FileText, Settings, Database, Layers } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

const HomeRoute: React.FC = () => {
  const [selectedSubstationId, setSelectedSubstationId] = useState<string>();
  const [activeTab, setActiveTab] = useState<string>('get-started');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSidebarItem, setActiveSidebarItem] = useState('explorer');

  const substationsData = useSubstations();
  const substationDetails = useSubstationDetails(selectedSubstationId);

  const handleSubstationSelect = (id: string) => {
    setSelectedSubstationId(id);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const sidebarItems = [
    { id: 'explorer', icon: <FileText size={18} />, label: 'Explorer' },
    { id: 'network', icon: <Database size={18} />, label: 'Network' },
    { id: 'layers', icon: <Layers size={18} />, label: 'Layers' },
    { id: 'settings', icon: <Settings size={18} />, label: 'Settings' },
  ];

  const tabs: TabItem[] = [
    {
      id: 'get-started',
      label: 'Substation',
      content: (
        <div className="h-full w-full">
          <SubstationViewer
            substationId={selectedSubstationId}
            substationDetails={substationDetails}
          />
        </div>
      ),
    },
    {
      id: 'logbook',
      label: 'Logbook',
      content: <div className="p-4">Logbook</div>,
    },
  ];

  return (
    <EditorLayout>
      <div className="flex w-full h-full bg-gray-50">
        {/* VSCode-style sidebar with icons */}
        <div className="flex h-full">
          {/* Icon bar */}
          <div className="flex flex-col bg-gray-900 w-12 h-full text-secondary border-r gap-y-4 p-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                className={cn(
                  'flex items-center justify-center h-12 w-full relative hover:text-foreground',
                  activeSidebarItem === item.id && 'text-foreground',
                )}
                onClick={() => {
                  if (activeSidebarItem === item.id) {
                    setSidebarOpen(!sidebarOpen);
                  } else {
                    setActiveSidebarItem(item.id);
                    setSidebarOpen(true);
                  }
                }}
                title={item.label}
              >
                {item.icon}
                {activeSidebarItem === item.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500"></div>
                )}
              </button>
            ))}
          </div>

          {/* Sidebar content */}
          {sidebarOpen && (
            <div className="w-64 bg-gray-800  overflow-y-auto border-r">
              {activeSidebarItem === 'explorer' && (
                <div className="">
                  <NetworkExplorer
                    substationsData={substationsData}
                    selectedSubstationId={selectedSubstationId}
                    onSubstationSelect={handleSubstationSelect}
                  />
                </div>
              )}

              {activeSidebarItem === 'network' && (
                <div className="p-2">
                  <div className="text-sm">Network Content</div>
                </div>
              )}

              {activeSidebarItem === 'layers' && (
                <div className="p-2">
                  <div className="text-sm">Layers Content</div>
                </div>
              )}

              {activeSidebarItem === 'settings' && (
                <div className="p-2">
                  <div className="text-sm">Settings Content</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-col h-full"
          >
            <div className="border-b">
              <TabsList className="bg-transparent h-auto p-0">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      'px-6 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:shadow-none',
                      activeTab === tab.id
                        ? 'font-medium text-blue-600'
                        : 'text-gray-600',
                    )}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="flex-1 overflow-hidden p-5 pt-2 bg-secondary">
              {tabs.map((tab) => (
                <TabsContent
                  key={tab.id}
                  value={tab.id}
                  className="h-full flex-1"
                >
                  {tab.content}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </div>
      </div>
    </EditorLayout>
  );
};

export default HomeRoute;
