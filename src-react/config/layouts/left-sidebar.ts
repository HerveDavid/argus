import { Folder, Terminal as TerminalIcon, ClockIcon } from 'lucide-react';

import { EquipmentExplorer } from '@/features/equipment-explorer';
import Terminal from '@/features/terminal';
import { SidebarItem } from '@/types/sidebar-item';

export const leftSidebarPanels: SidebarItem[] = [
  {
    id: 'equipment-explorer',
    icon: Folder,
    label: 'Explorer',
    content: EquipmentExplorer,
  },
  {
    id: 'equipment-explorer2',
    icon: ClockIcon,
    label: 'Test 2',
    content: Terminal,
  },
] as const;

export const leftSidebarTools: SidebarItem[] = [
  { id: 'terminal', icon: TerminalIcon, label: 'Terminal', content: Terminal },
] as const;
