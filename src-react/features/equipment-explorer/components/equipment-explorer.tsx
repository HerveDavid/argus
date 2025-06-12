import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubstationsExplorer } from './substations';

import { cn } from '@/lib/utils';
import { invoke } from '@tauri-apps/api/core';

type TabType = 'substations' | 'voltageLevels';

interface EquipmentExplorerProps {
  defaultTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

// Interface pour exposer les méthodes de refresh
interface ExplorerRef {
  handleLoadAll: () => void;
}

export const EquipmentExplorer = () => {
  const defaultTab: TabType = 'substations';
  const onTabChange = (tab: TabType) => {};

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const init = async () => {
      await invoke('load_substations');
    };

    init();
  });

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
      </Tabs>
    </div>
  );
};
