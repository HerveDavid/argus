import React from 'react';
import { Substation } from '../../types/substation.type';
import { Card } from '@/components/ui/card';

interface SubstationListProps {
  substations: Substation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export const SubstationList: React.FC<SubstationListProps> = ({
  substations,
  selectedId,
  onSelect,
  isLoading,
}) => {
  if (isLoading) {
    return <>Loading substations...</>;
  }

  if (substations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {substations.map((substation) => (
        <Card key={substation.id} className="p-0 shadow-xs hover:bg-secondary">
          <div
            className={`cursor-pointer p-2 ${
              selectedId === substation.id ? 'bg-blue-100' : 'hover:bg-gray-100'
            }`}
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
      ))}
    </div>
  );
};