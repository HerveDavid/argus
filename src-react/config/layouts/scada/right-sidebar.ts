import { ClockIcon, LogsIcon } from 'lucide-react';

import { EventsLog } from '@/features/events-log';
import { History } from '@/features/historic';
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
] as const;
