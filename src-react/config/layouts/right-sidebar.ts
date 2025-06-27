import {
    Layers,
    Terminal as TerminalIcon,
  } from 'lucide-react';
  
  import { EventsLog } from '@/features/events-log';
  import Widgets from '@/features/widgets';
  import { SidebarItem } from '@/types/sidebar-item';

  export const rightSidebarPanels: SidebarItem[] = [
    { id: 'widgets', icon: Layers, label: 'Widgets', content: Widgets },
  ] as const;
  
  export const rightSidebarTools: SidebarItem[] = [
    { id: 'log', icon: TerminalIcon, label: 'Log', content: EventsLog },
  ] as const;