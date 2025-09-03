import { Clapperboard, Folder, Terminal as TerminalIcon } from 'lucide-react';

import { EquipmentExplorer } from '@/features/equipment-explorer';
import Terminal from '@/features/terminal';
import { SidebarItem } from '@/types/sidebar-item.ts';

export const leftSidebarPanels: SidebarItem[] = [
  {
    id: 'equipment-explorer',
    icon: Folder,
    label: 'Explorer',
    content: EquipmentExplorer,
  },
  {
    id: 'scenario-explorer',
    icon: Clapperboard,
    label: 'Scenario',
    content: EquipmentExplorer,
  },
] as const;

export const leftSidebarTools: SidebarItem[] = [
  {
    id: 'terminal',
    icon: TerminalIcon,
    label: 'Terminal',
    content: Terminal,
  },
] as const;
