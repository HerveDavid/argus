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
import { DslExplorer } from '@/features/dsl-explorer';

export const leftSidebarPanels: SidebarItem[] = [
  {
    id: 'equipment-explorer',
    icon: Folder,
    label: 'Equipment',
    content: EquipmentExplorer,
  },
  {
    id: 'scenario-explorer',
    icon: Clapperboard,
    label: 'Scenario',
    content: DslExplorer,
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
