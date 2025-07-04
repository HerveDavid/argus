import { ChartGantt, ClockIcon, Layers, LogsIcon } from 'lucide-react';

import { EventsLog } from '@/features/events-log';
import Widgets from '@/features/widgets';
import { SidebarItem } from '@/types/sidebar-item';
import { History } from '@/features/historic';
import TaskDashboard from '@/features/task-dashboard';

export const rightSidebarPanels: SidebarItem[] = [
  { id: 'widgets', icon: Layers, label: 'Widgets', content: Widgets },
  { id: 'historic', icon: ClockIcon, label: 'Historic', content: History },
] as const;

export const rightSidebarTools: SidebarItem[] = [
  { id: 'log', icon: LogsIcon, label: 'Log', content: EventsLog },
  {
    id: 'task-dashboard',
    icon: ChartGantt,
    label: 'Task Dashboard',
    content: TaskDashboard,
  },
] as const;
