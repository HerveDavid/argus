import React from 'react';
import SingleLineDiagram from '../single-line-diagram';

interface SubstationViewerProps {
  substationId?: string;
  substationDetails?: any; // TODO: Need to create an api
}

export const SubstationViewer: React.FC<SubstationViewerProps> = ({
  substationId,
}) => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 bg-secondary overflow-hidden">
        <div className="h-full w-full flex items-center justify-center bg-secondary">
          {substationId && (
            <SingleLineDiagram
              lineId={substationId}
              width="100%"
              height="100%"
              className="bg-background border rounded-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
};
