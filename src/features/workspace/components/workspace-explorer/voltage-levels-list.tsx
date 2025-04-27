import React from 'react';
import { VoltageLevel } from '@/types/voltage-level.type';
import { Card } from '@/components/ui/card';

interface VoltageLevelsListProps {
  voltageLevels: VoltageLevel[];
  selectedId?: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export const VoltageLevelsList: React.FC<VoltageLevelsListProps> = ({
  voltageLevels,
  selectedId,
  onSelect,
  isLoading,
}) => {
  if (isLoading) {
    return <>Loading voltage levels...</>;
  }

  if (voltageLevels.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {voltageLevels.map((voltageLevel) => (
        <Card
          key={voltageLevel.id}
          className="p-0 shadow-xs hover:bg-secondary"
        >
          <div
            className={`cursor-pointer p-2 ${
              selectedId === voltageLevel.id
                ? 'bg-blue-100'
                : 'hover:bg-gray-100'
            }`}
            onClick={() => onSelect(voltageLevel.id)}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium truncate text-sm">
                {voltageLevel.id}
              </span>
              <span className="font-medium truncate text-sm text-muted-foreground">
                {voltageLevel.nominal_v} kV
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
