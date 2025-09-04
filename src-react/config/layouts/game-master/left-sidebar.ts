import {
  Clapperboard,
  ClockIcon,
  Folder,
  Terminal as TerminalIcon,
} from 'lucide-react';

import { EquipmentExplorer } from '@/features/equipment-explorer';
import Terminal from '@/features/terminal';
import { SidebarItem } from '@/types/sidebar-item.ts';
import { History } from '@/features/historic';
import { TreeFolder } from '@/features/editor';

export const leftSidebarPanels: SidebarItem[] = [
  {
    id: 'equipment-explorer',
    icon: Folder,
    label: 'Explorer',
    content: EquipmentExplorer,
  },
  {
    id: 'scenario-folder',
    icon: Clapperboard,
    label: 'Scenario',
    content: TreeFolder,
  },
] as const;

export const leftSidebarTools: SidebarItem[] = [
  {
    id: 'terminal',
    icon: TerminalIcon,
    label: 'Terminal',
    content: Terminal,
  },
  { id: 'historic', icon: ClockIcon, label: 'Historic', content: History },
] as const;
