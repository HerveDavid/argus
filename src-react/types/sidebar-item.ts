import { LucideProps } from 'lucide-react';
import React, { JSX } from 'react';

export interface SidebarItem {
  id: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
  >;
  label: string;
  content: () => JSX.Element;
}
