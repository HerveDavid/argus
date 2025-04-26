import React, { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubstationsExplorer } from './substations';
import { VoltageLevelsExplorer } from './voltage-levels';
import { cn } from '@/lib/utils';

type TabType = 'substations' | 'voltageLevels';

interface NetworkExplorerProps {
  defaultTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

// Interface pour exposer les méthodes de refresh
interface ExplorerRef {
  handleLoadAll: () => void;
}

export const NetworkExplorer: React.FC<NetworkExplorerProps> = ({
  defaultTab = 'substations',
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refs pour accéder aux méthodes des composants enfants
  const substationsRef = useRef<ExplorerRef>(null);
  const voltageLevelsRef = useRef<ExplorerRef>(null);

  const handleTabChange = (value: string) => {
    const newTab = value as TabType;
    setActiveTab(newTab);
    onTabChange?.(newTab);
  };

  // Fonction de refresh qui appelle les deux loadAll
  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      // Appel des deux fonctions de refresh en parallèle
      await Promise.all([
        substationsRef.current?.handleLoadAll(),
        voltageLevelsRef.current?.handleLoadAll(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center border-b border-gray-200 p-2">
        <h3 className="uppercase text-sm">Network Explorer</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshAll}
          disabled={isRefreshing}
          title="Reload all data"
          className="h-7 w-7 p-0"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>

      {/* Tab-based navigation */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex-1 flex flex-col"
      >
        <TabsList className="rounded-none border-b">
          <TabsTrigger
            value="substations"
            className={cn(
              'py-2 rounded-none hover:text-foreground shadow-none data-[state=active]:border-x',
            )}
          >
            Substations
          </TabsTrigger>
          <TabsTrigger
            value="voltageLevels"
            className={cn(
              'py-2 rounded-none hover:text-foreground shadow-none data-[state=active]:border-x',
            )}
          >
            Voltage Levels
          </TabsTrigger>
        </TabsList>

        {/* Substations Tab Content */}
        <TabsContent
          value="substations"
          className="flex-1 flex flex-col overflow-hidden mt-2"
        >
          <SubstationsExplorer ref={substationsRef} />
        </TabsContent>

        {/* Voltage Levels Tab Content */}
        <TabsContent
          value="voltageLevels"
          className="flex-1 flex flex-col overflow-hidden mt-2"
        >
          <VoltageLevelsExplorer ref={voltageLevelsRef} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
