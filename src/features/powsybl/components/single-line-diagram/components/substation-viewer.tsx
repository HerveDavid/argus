import React from 'react';
import SingleLineDiagram from '..';

interface SubstationViewerProps {
  substationId?: string;
}

export const SubstationViewer: React.FC<SubstationViewerProps> = ({
  substationId,
}) => {
  return (
    <div className="relative w-full h-full p-3">
      {substationId ? (
        <SingleLineDiagram
          lineId={substationId}
          width="100%"
          height="100%"
          className="absolute inset-0 bg-background border rounded-sm"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary">
          <p>No substation selected</p>
        </div>
      )}
    </div>
  );
};
