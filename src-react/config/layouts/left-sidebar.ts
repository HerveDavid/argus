import {
  Folder,
  Terminal as TerminalIcon,
  LogsIcon,
  ClockIcon,
} from 'lucide-react';

import { EquipmentExplorer } from '@/features/equipment-explorer';
import { EventsLog } from '@/features/events-log';
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
    label: 'Franck',
    content: Terminal,
  },
] as const;

export const leftSidebarTools: SidebarItem[] = [
  { id: 'terminal', icon: TerminalIcon, label: 'Terminal', content: Terminal },
  { id: 'log', icon: LogsIcon, label: 'Log', content: EventsLog },
] as const;
