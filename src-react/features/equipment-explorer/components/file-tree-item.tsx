import {
  Folder,
  ChevronRight,
  ChevronDown,
  File,
  FolderOpen,
  EllipsisVertical,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Substation, VoltageLevel } from '@/types/substation';
import { useCentralPanelStore } from '@/stores/central-panel.store';

import { DraggableItem } from './draggable-item';
import { formatVoltage, getVoltageLevelColor, getTopologyIcon } from '../utils';
import { useWindowHeaderStore } from '@/stores/window-header.store';
import { useDoubleClick } from '@/hooks/use-double-click';

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
  const { setTitle } = useWindowHeaderStore();
  const { addPanel } = useCentralPanelStore();

  const handleToggle = () => {
    if (item.type === 'substation' && onToggle) {
      onToggle();
    }
  };

  const openSubstation = () => {
    const id = item.id;
    addPanel({
      id,
      tabComponent: 'default',
      component: 'sld',
      params: { id },
    });
    setTitle(id);
  };

  const { onClick, onDoubleClick } = useDoubleClick({
    onSingleClick: handleToggle,
  });

  if (item.type === 'substation' && item.substation) {
    const sub = item.substation;
    return (
      <div className="space-y-1">
        <DraggableItem id={sub.id}>
          <Card className="p-0 m-2 shadow-xs hover:bg-secondary">
            <div
              className="p-3"
              onClick={onClick}
              onDoubleClick={onDoubleClick}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-1 truncate items-center gap-2">
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
                </div>
                <div className="flex flex-1 truncate items-center gap-2">
                  {sub.tso && (
                    <Badge variant="secondary" className="text-xs">
                      {sub.tso}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {sub.country}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {sub.voltage_levels?.length || 0} Voltage Level
                    {(sub.voltage_levels?.length || 0) > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="hover:bg-accent rounded-sm hover:text-accent-foreground text-muted-foreground">
                      <EllipsisVertical className="size-4 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={openSubstation}>
                        Open Panel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </Card>
        </DraggableItem>

        {expanded && item.children && (
          <div className="ml-4">
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
      <DraggableItem id={vl.id}>
        <Card className="p-0 m-2 shadow-xs hover:bg-secondary">
          <div className="p-3">
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
      </DraggableItem>
    );
  }

  return null;
};
