import {
  Layers,
  Folder,
  Terminal as TerminalIcon,
  LogsIcon,
  ChartAreaIcon,
  CircleGaugeIcon,
  ClockIcon,
} from 'lucide-react';

import EquipmentExplorer from '@/features/equipment-explorer';
import { EventsLog } from '@/features/events-log';
import Terminal from '@/features/terminal';
import Widgets from '@/features/widgets';
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
  { id: 'log', icon: LogsIcon, label: 'Log', content: Terminal },
] as const;

export const rightSidebarPanels: SidebarItem[] = [
  { id: 'widgets', icon: Layers, label: 'Widgets', content: Widgets },
] as const;

export const rightSidebarTools: SidebarItem[] = [
  { id: 'log', icon: TerminalIcon, label: 'Log', content: EventsLog },
] as const;

export const rightSidebarSlds: SidebarItem[] = [
  {
    id: 'charts',
    icon: ChartAreaIcon,
    label: 'Charts',
    content: Terminal,
  },
  {
    id: 'charts2',
    icon: CircleGaugeIcon,
    label: 'Charts2',
    content: Terminal,
  },
];
