import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Tools } from './tools';
import { Substation } from '@/types/substation.type';
import { VoltageLevel } from '@/types/voltage-level.type';
export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}
export const TabNavigation: React.FC<{
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  element: Substation | VoltageLevel;
}> = ({ tabs, activeTab, onTabChange, element }) => {
  return (
    <div className="border-b flex justify-between">
      <TabsList className="bg-transparent h-5 p-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className={cn(
              'ml-2 px-6 py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:bg-secondary hover:text-foreground',
              activeTab === tab.id
                ? 'font-medium border-r border-l bg-secondary'
                : 'text-muted-foreground',
            )}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <Tools element={element} />
    </div>
  );
};
