import { useState } from 'react';
import EditorLayout from '@/components/layouts/editor';
import { useSubstationDetails } from '@/features/powsybl/hooks/use-substation-details';
import { SubstationViewer } from '@/features/powsybl/components/single-line-diagram/components/substation-viewer';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { TabItem, TabNavigation } from './tab-navigation';
import { useParams } from 'react-router';
import { Substation } from '@/types/substation.type';
import { useVoltageLevelDetails } from '@/features/powsybl/hooks/use-voltage-level-details';
import { VoltageLevel } from '@/types/voltage-level.type';
// Main component
const StateView = () => {
  // Params route
  const { substationId, type } = useParams();

  // State
  const [activeTab, setActiveTab] = useState<string>('get-started');
  const elementDetails =
    type === 'substation'
      ? useSubstationDetails(substationId)
      : useVoltageLevelDetails(substationId);

  const tabs: TabItem[] = [
    {
      id: 'get-started',
      label: 'Diagram',
      content: (
        <div className="h-full w-full">
          <SubstationViewer substationId={substationId} />
        </div>
      ),
    },
    {
      id: 'commands',
      label: 'Commands',
      content: <div className="p-4">Commands</div>,
    },
    {
      id: 'logbook',
      label: 'Logbook',
      content: <div className="p-4">Logbook</div>,
    },
  ];

  return (
    <EditorLayout>
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
            element={elementDetails.data as VoltageLevel | Substation}
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
    </EditorLayout>
  );
};
export default StateView;
