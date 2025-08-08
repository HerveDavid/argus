import { ChartGantt, CircleGauge, ClockIcon, LogsIcon } from 'lucide-react';

import { EventsLog } from '@/features/events-log';
import { History } from '@/features/historic';
import TaskDashboard from '@/features/task-dashboard';
import { TimelineEditor } from '@/features/timeline-editor';
import { SidebarItem } from '@/types/sidebar-item.ts';

export const rightSidebarPanels: SidebarItem[] = [
  {
    id: 'historic',
    icon: ClockIcon,
    label: 'Historic',
    content: History,
  },
] as const;

export const rightSidebarTools: SidebarItem[] = [
  { id: 'log', icon: LogsIcon, label: 'Log', content: EventsLog },
  {
    id: 'timeline-editor',
    icon: ChartGantt,
    label: 'Timeline',
    content: TimelineEditor,
  },
  {
    id: 'task-dashboard',
    icon: CircleGauge,
    label: 'Task Dashboard',
    content: TaskDashboard,
  },
] as const;
