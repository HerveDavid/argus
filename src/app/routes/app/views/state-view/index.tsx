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
        <NetworkExplorer
          substationsData={substationsData}
          selectedSubstationId={selectedSubstationId}
          onSubstationSelect={handleSubstationSelect}
        />
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
