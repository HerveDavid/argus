import { NetworkExplorer } from '@/features/network/components/network-explorer';
import React from 'react';

export const SidebarContent: React.FC<{
  activeItem: string;
}> = ({ activeItem }) => {
  switch (activeItem) {
    case 'explorer':
      return <NetworkExplorer />;
    case 'workspace':
      return (
        <div className="p-2">
          <div className="text-sm">Workspace</div>
        </div>
      );
    case 'layers':
      return (
        <div className="p-2">
          <div className="text-sm">Layers Content</div>
        </div>
      );
    default:
      return null;
  }
};
