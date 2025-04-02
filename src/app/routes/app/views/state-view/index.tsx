import React, { useState } from 'react';
import EditorLayout from '@/components/layouts/editor';
import { useSubstations } from '@/features/network/hooks/use-substations';
import { useSubstationDetails } from '@/features/network/hooks/use-substation-details';
import { SubstationViewer } from '@/features/network/components/network-explorer/substation-viewer';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Settings, Layers, Waypoints, Folder } from 'lucide-react';
import { SidebarIconButton, SidebarItem } from './sidebar-icon-button';
import { SidebarContent } from './sidebar-content';
import { TabItem, TabNavigation } from './tab-navigation';

// Main component
const HomeRoute: React.FC = () => {
  // State
  const [selectedSubstationId, setSelectedSubstationId] = useState<string>();
  const [activeTab, setActiveTab] = useState<string>('get-started');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSidebarItem, setActiveSidebarItem] = useState('explorer');

  // Hooks
  const substationsData = useSubstations();
  const substationDetails = useSubstationDetails(selectedSubstationId);

  // Handlers
  const handleSubstationSelect = (id: string) => {
    setSelectedSubstationId(id);
  };

  const handleSidebarItemClick = (itemId: string) => {
    if (activeSidebarItem === itemId) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setActiveSidebarItem(itemId);
      setSidebarOpen(true);
    }
  };

  // Data
  const sidebarItems: SidebarItem[] = [
    { id: 'explorer', icon: <Waypoints size={18} />, label: 'Explorer' },
    { id: 'workspace', icon: <Folder size={18} />, label: 'Workspace' },
    { id: 'layers', icon: <Layers size={18} />, label: 'Layers' },
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
    {
      id: 'history',
      label: 'History',
      content: <div className="p-4">History</div>,
    },
  ];

  return (
    <EditorLayout>
      <div className="flex w-full h-full">
        {/* VSCode-style sidebar */}
        <div className="flex h-full">
          {/* Icon bar */}
          <div className="flex flex-col h-full text-secondary border-r gap-2">
            {sidebarItems.map((item) => (
              <SidebarIconButton
                key={item.id}
                item={item}
                isActive={activeSidebarItem === item.id}
                onClick={() => handleSidebarItemClick(item.id)}
              />
            ))}
          </div>

          {/* Sidebar content */}
          {sidebarOpen && (
            <div className="w-64 bg-gray-800 overflow-y-auto border-r">
              <SidebarContent
                activeItem={activeSidebarItem}
                substationsData={substationsData}
                selectedSubstationId={selectedSubstationId}
                onSubstationSelect={handleSubstationSelect}
              />
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
            <TabNavigation
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
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
