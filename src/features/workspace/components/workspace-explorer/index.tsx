import React, { useState, useEffect } from 'react';
import { SubstationList } from './substation-list';
import { useWorkspaceStore } from '../../stores/use-workspace.store';
import { Substation } from '@/types/substation.type';
import { useNavigate } from 'react-router';
import { paths } from '@/config/paths';

export const WorkspaceExplorer: React.FC = () => {
  const { substations } = useWorkspaceStore();
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Convert Map to Array for the SubstationList component
  const substationArray: Substation[] = Array.from(substations.values());
  const navigate = useNavigate();

  const handleSubstationSelect = (id: string) => {
    navigate(paths.views.stateView.getHref(id));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center border-b border-gray-200 p-2">
        <h3 className="uppercase text-sm">Workspace</h3>
        <div className="text-xs text-gray-500">
          {substationArray.length}{' '}
          {substationArray.length === 1 ? 'substation' : 'substations'}
        </div>
      </div>
      {/* Modified structure to create separate scrollable section */}
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
    </div>
  );
};
