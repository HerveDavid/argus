import {
  Folder,
  ChevronRight,
  ChevronDown,
  File,
  FolderOpen,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Substation, VoltageLevel } from '@/types/substation';

import { DraggableItem } from './draggable-item';
import { formatVoltage, getVoltageLevelColor, getTopologyIcon } from '../utils';

export interface FileTreeItemProps {
  item: {
    id: string;
    name: string;
    type: 'substation' | 'voltage_level';
    substation?: Substation;
    voltageLevel?: VoltageLevel;
    children?: any[];
  };
  level?: number;
  expanded?: boolean;
  onToggle?: () => void;
}

export const FileTreeItem = ({
  item,
  level = 0,
  expanded = false,
  onToggle,
}: FileTreeItemProps) => {
  const handleToggle = () => {
    if (item.type === 'substation' && onToggle) {
      onToggle();
    }
  };

  if (item.type === 'substation' && item.substation) {
    const sub = item.substation;
    return (
      <div className="space-y-1">
        <DraggableItem substation={sub}>
          <Card className="p-0 m-2 shadow-xs hover:bg-secondary">
            <div className="cursor-pointer p-3" onClick={handleToggle}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {expanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  {expanded ? (
                    <FolderOpen className="w-4 h-4 text-primary" />
                  ) : (
                    <Folder className="w-4 h-4 text-primary" />
                  )}
                  <span className="font-medium truncate text-sm">{sub.id}</span>
                  <span className="text-sm text-muted-foreground truncate">
                    {sub.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* <Badge variant="secondary" className="text-xs">
                      {sub.tso}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {sub.country}
                    </div> */}
                  <span className="text-xs text-muted-foreground">
                    {sub.voltage_levels?.length || 0} Voltage Levels
                    {(sub.voltage_levels?.length || 0) > 1 ? ' x' : ''}
                  </span>
                </div>
              </div>
              {sub.geo_tags && (
                <div className="text-xs text-muted-foreground font-mono mt-2 ml-6">
                  📍 {sub.geo_tags}
                </div>
              )}
            </div>
          </Card>
        </DraggableItem>

        {expanded && item.children && (
          <div className="ml-4 space-y-1">
            {item.children.map((child: any, index: number) => (
              <FileTreeItem key={index} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (item.type === 'voltage_level' && item.voltageLevel) {
    const vl = item.voltageLevel;
    return (
      <Card className="p-0 m-2 shadow-xs hover:bg-secondary">
        <div className="cursor-pointer p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <File className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">{vl.id}</span>
              <span className="text-sm text-muted-foreground truncate">
                {vl.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`font-bold text-sm ${getVoltageLevelColor(vl.nominal_v)}`}
              >
                {formatVoltage(vl.nominal_v)}
              </span>
              <span className="text-xs text-muted-foreground">
                {getTopologyIcon(vl.topology_kind)}
              </span>
              {vl.fictitious && (
                <Badge variant="destructive" className="text-xs">
                  ⚠️
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 ml-6">
            <span>Min: {formatVoltage(vl.low_voltage_limit)}</span>
            <span>Max: {formatVoltage(vl.high_voltage_limit)}</span>
          </div>
        </div>
      </Card>
    );
  }

  return null;
};
