import React from 'react';
import { cn } from '@/lib/utils';

export interface SidebarItem {
  id: string;
  icon: React.ReactNode;
  label: string;
}

export const SidebarIconButton: React.FC<{
  item: SidebarItem;
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => (
  <button
    className={cn(
      'flex items-center justify-center h-12 w-full relative hover:text-foreground',
      isActive && 'text-foreground',
    )}
    onClick={onClick}
    title={item.label}
  >
    {item.icon}
    {isActive && (
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500"></div>
    )}
  </button>
);