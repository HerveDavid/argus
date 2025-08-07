import {
    ChartAreaIcon,
    CircleGaugeIcon,
  } from 'lucide-react';
  
  import ChartComponent from '@/features/chart';
  import Terminal from '@/features/terminal';
  import { SidebarItem } from '@/types/sidebar-item';
  

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
      content: ChartComponent,
    },
  ];