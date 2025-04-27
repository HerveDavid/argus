import React from 'react';
import { LegendOverlayProps } from '../types/single-line-diagram.type';

const LegendOverlay: React.FC<LegendOverlayProps> = ({ className = '' }) => {
  return (
    <div
      className={`absolute bottom-2 right-2 p-2 bg-secondary rounded shadow-md text-xs font-sans ${className}`}
    >
      <div className="font-semibold mb-1">Interactions:</div>
      <div className="flex items-center mb-1">
        <div className="w-4 h-4 mr-1 border border-gray-500 flex items-center justify-center">
          <span className="text-xs">🖱️</span>
        </div>
        <span>Click = Open/Close circuit breaker</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 mr-1 border border-gray-500 flex items-center justify-center">
          <span className="text-xs">🖱️</span>
        </div>
        <span>Right click = Context menu</span>
      </div>
    </div>
  );
};

export default LegendOverlay;
