import React from 'react';
import { NetworkExplorer } from '@/features/network/components/network-explorer';

export const SidebarContent: React.FC<{
  activeItem: string;
  substationsData: any; // Replace with proper type
  selectedSubstationId?: string;
  onSubstationSelect: (id: string) => void;
}> = ({
  activeItem,
  substationsData,
  selectedSubstationId,
  onSubstationSelect,
}) => {
  switch (activeItem) {
    case 'explorer':
      return (
        <NetworkExplorer
          substationsData={substationsData}
          selectedSubstationId={selectedSubstationId}
          onSubstationSelect={onSubstationSelect}
        />
      );
    case 'network':
      return (
        <div className="p-2">
          <div className="text-sm">Network Content</div>
        </div>
      );
    case 'layers':
      return (
        <div className="p-2">
          <div className="text-sm">Layers Content</div>
        </div>
      );
    case 'settings':
      return (
        <div className="p-2">
          <div className="text-sm">Settings Content</div>
        </div>
      );
    default:
      return null;
  }
};
