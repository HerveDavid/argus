import React, { useState, useEffect } from 'react';
import { SubstationList } from './substation-list';
import { useWorkspaceStore } from '../../stores/use-workspace.store';
import { Substation } from '@/types/substation.type';
import { useNavigate } from 'react-router';
import { paths } from '@/config/paths';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { VoltageLevel } from '@/types/voltage-level.type';
import { VoltageLevelsList } from './voltage-levels-list';

export const WorkspaceExplorer: React.FC = () => {
  const { substations, voltageLevels } = useWorkspaceStore();
  const [selectedId] = useState<string | undefined>(undefined);
  const [isLoading] = useState<boolean>(false);

  // Convert Map to Array for the SubstationList component
  const substationArray: Substation[] = Array.from(substations.values());
  const voltageLevelsArray: VoltageLevel[] = Array.from(voltageLevels.values());

  const navigate = useNavigate();
  const handleSubstationSelect = (id: string) => {
    navigate(paths.views.stateView.getHref(id, 'substation'));
  };
  const handleVoltageLevelSelect = (id: string) => {
    navigate(paths.views.stateView.getHref(id, 'voltage-level'));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center border-b border-gray-200 p-2">
        <h3 className="uppercase text-sm">Workspace</h3>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1" className="px-2">
          <AccordionTrigger className="text-xs text-gray-500">
            Substations ({substationArray.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-2">
                <SubstationList
                  substations={substationArray}
                  selectedId={selectedId}
                  onSelect={handleSubstationSelect}
                  isLoading={isLoading}
                />
                {substationArray.length === 0 && !isLoading && (
                  <div className="text-center p-4 text-gray-500 text-sm">
                    No substations in workspace
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2" className="px-2">
          <AccordionTrigger className="text-xs text-gray-500">
            Voltage Levels ({voltageLevelsArray.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-2">
                <VoltageLevelsList
                  voltageLevels={voltageLevelsArray}
                  selectedId={selectedId}
                  onSelect={handleVoltageLevelSelect}
                  isLoading={isLoading}
                />
                {voltageLevelsArray.length === 0 && !isLoading && (
                  <div className="text-center p-4 text-gray-500 text-sm">
                    No voltage levels in workspace
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
