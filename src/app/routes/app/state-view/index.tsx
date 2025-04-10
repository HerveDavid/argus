import { useEffect, useState } from 'react';
import EditorLayout from '@/components/layouts/editor';
import { useSubstationDetails } from '@/features/network/hooks/use-substation-details';
import { SubstationViewer } from '@/features/network/components/network-explorer/substation-viewer';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { TabItem, TabNavigation } from './tab-navigation';
import { useParams } from 'react-router';
import { useDiagramStore } from '@/features/network/stores/use-diagram.store';
import { Button } from '@/components/ui/button';

// Main component
const StateView = () => {
  // Params route
  const { substationId } = useParams();

  // State
  const [activeTab, setActiveTab] = useState<string>('get-started');
  const substationDetails = useSubstationDetails(substationId);
  const { unsubscribeDiagram } = useDiagramStore();

  // Init
  useEffect(() => {
    return () => {
      const cleanup = async () => {
        try {
          await unsubscribeDiagram();
        } catch (error) {
          console.error('Failed when unscribedDiagram', error);
        }
      };

      cleanup();
    };
  }, [substationId]);

  const tabs: TabItem[] = [
    {
      id: 'get-started',
      label: 'Substation',
      content: (
        <div className="h-full w-full">
          <SubstationViewer
            substationId={substationId}
            substationDetails={substationDetails}
          />
        </div>
      ),
    },
    {
      id: 'commands',
      label: 'Commands',
      content: (
        <div className="p-4">
          <Button onClick={unsubscribeDiagram}>unsubscribe</Button>
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
    </EditorLayout>
  );
};

export default StateView;
