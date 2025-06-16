import React from 'react';
import { Substation } from '@/types/substation';
import { Card } from '@/components/ui/card';
import DraggableItem from '../draggable-item';

interface VoltageLevelsListProps {
  substations: Substation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export const VoltageLevelsList: React.FC<VoltageLevelsListProps> = ({
  substations,
  onSelect,
  isLoading,
}) => {
  if (isLoading) {
    return <>Loading voltage levels...</>;
  }

  if (substations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {substations.map((substation) => (
        <DraggableItem substation={substation} key={substation.id}>
          <Card className="p-0 m-2 shadow-xs hover:bg-secondary">
            <div
              className="cursor-pointer p-2"
              onClick={() => onSelect(substation.id)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium truncate text-sm">
                  {substation.id}
                </span>
                <span className="font-medium truncate text-sm text-muted-foreground">
                  {substation.country}
                </span>
              </div>
            </div>
          </Card>
        </DraggableItem>
      ))}
    </div>
  );
};
