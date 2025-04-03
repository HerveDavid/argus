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
      'flex items-center justify-center size-8 w-full relative hover:text-foreground p-3 text-muted-foreground',
      isActive && 'text-foreground',
    )}
    onClick={onClick}
    title={item.label}
  >
    {item.icon}
    {isActive && (
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
    )}
  </button>
);
