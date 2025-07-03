// components/EquipmentHeader.tsx
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  SWITCH_COMPONENT_TYPES, 
  FEEDER_COMPONENT_TYPES, 
  BUSBAR_SECTION_TYPES 
} from '@/types/sld-metadata';
import { EquipmentHeaderProps } from '../types';

export const EquipmentHeader: React.FC<EquipmentHeaderProps> = ({ info }) => {
  const getTypeColor = (type: string | null): string => {
    if (!type) return 'var(--muted-foreground)';

    if (SWITCH_COMPONENT_TYPES.has(type)) return '#3b82f6'; // blue
    if (FEEDER_COMPONENT_TYPES.has(type)) return '#10b981'; // green
    if (BUSBAR_SECTION_TYPES.has(type)) return '#f59e0b'; // yellow
    if (type === 'WIRE' || type === 'LINE') return '#6b7280'; // gray
    if (type === 'BUS') return '#8b5cf6'; // purple

    return 'var(--muted-foreground)';
  };

  return (
    <div className="px-2 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm" style={{ color: 'var(--primary)' }}>
          {info.tagName}
        </span>
        {info.id && (
          <Badge
            variant="outline"
            className="text-xs"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--muted-foreground)',
              backgroundColor: 'var(--background)',
            }}
          >
            #{info.id}
          </Badge>
        )}
      </div>

      {/* Component Type */}
      {info.componentType && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium">Type:</span>
          <Badge
            variant="outline"
            className="text-xs font-mono"
            style={{
              borderColor: getTypeColor(info.componentType),
              color: getTypeColor(info.componentType),
              backgroundColor: 'var(--background)',
            }}
          >
            {info.componentType}
          </Badge>
        </div>
      )}

      {/* Equipment ID */}
      {info.equipmentId && info.equipmentId !== info.id && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium">Equipment:</span>
          <Badge
            variant="secondary"
            className="text-xs font-mono"
            style={{
              backgroundColor: 'var(--secondary)',
              color: 'var(--secondary-foreground)',
            }}
          >
            {info.equipmentId}
          </Badge>
        </div>
      )}

      {/* Next Voltage Level for lines */}
      {info.type === 'line' && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium">Next Level:</span>
          <Badge
            variant="outline"
            className="text-xs font-mono"
            style={{
              borderColor: '#10b981',
              color: '#10b981',
              backgroundColor: 'var(--background)',
            }}
          >
            {info.nextVId}
          </Badge>
        </div>
      )}

      {/* Classes */}
      {info.classes.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {info.classes.map((cls, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="text-xs"
              style={{
                backgroundColor: 'var(--secondary)',
                color: 'var(--secondary-foreground)',
              }}
            >
              {cls}
            </Badge>
          ))}
        </div>
      )}

      {/* Text for labels */}
      {info.type === 'label' && info.text && (
        <div
          className="text-sm italic truncate"
          style={{ color: 'var(--muted-foreground)' }}
        >
          "{info.text}"
        </div>
      )}
    </div>
  );
};