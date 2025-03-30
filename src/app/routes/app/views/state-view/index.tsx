import React, { useState } from 'react';
import EditorLayout from '@/components/layouts/editor';
import { useSubstations } from '@/features/network/hooks/use-substations';
import { useSubstationDetails } from '@/features/network/hooks/use-substation-details';
import { NetworkExplorer } from '@/features/network/components/network-explorer';
import { SubstationViewer } from '@/features/network/components/network-explorer/substation-viewer';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

const HomeRoute: React.FC = () => {
  const [selectedSubstationId, setSelectedSubstationId] = useState<string>();
  const [activeTab, setActiveTab] = useState<string>('get-started');
  const substationsData = useSubstations();
  const substationDetails = useSubstationDetails(selectedSubstationId);

  const handleSubstationSelect = (id: string) => {
    setSelectedSubstationId(id);
  };

  const tabs: TabItem[] = [
    {
      id: 'get-started',
      label: 'Substation',
      content: (
        <div>
          <SubstationViewer
            substationId={selectedSubstationId}
            substationDetails={substationDetails}
          />
        </div>
      ),
    },
    {
      id: 'build',
      label: 'Build',
      content: <div className="p-4">Build content goes here</div>,
    },
    {
      id: 'manage',
      label: 'Manage',
      content: <div className="p-4">Manage content goes here</div>,
    },
    {
      id: 'tools',
      label: 'Tools',
      content: <div className="p-4">Tools content goes here</div>,
    },
    {
      id: 'all-docs',
      label: 'All docs',
      content: <div className="p-4">All documentation goes here</div>,
    },
  ];

  return (
    <EditorLayout>
      <div className="flex w-full h-full bg-gray-50">
        <NetworkExplorer
          substationsData={substationsData}
          selectedSubstationId={selectedSubstationId}
          onSubstationSelect={handleSubstationSelect}
        />
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="">
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </EditorLayout>
  );
};

export default HomeRoute;
