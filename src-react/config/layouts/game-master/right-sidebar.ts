import { GitFork, LogsIcon, SquareChartGantt } from 'lucide-react';

import { EventsLog } from '@/features/events-log';
import { GrafcetEditor } from '@/features/grafcet-editor';
import { TimelineEditor } from '@/features/timeline-editor';
import { SidebarItem } from '@/types/sidebar-item.ts';

export const rightSidebarPanels: SidebarItem[] = [
  {
    id: 'sequencer',
    icon: GitFork,
    label: 'Sequencer',
    content: GrafcetEditor,
  },
  { id: 'log', icon: LogsIcon, label: 'Log', content: EventsLog },
] as const;

export const rightSidebarTools: SidebarItem[] = [
  {
    id: 'timeline-editor',
    icon: SquareChartGantt,
    label: 'Timeline',
    content: TimelineEditor,
  },
] as const;
