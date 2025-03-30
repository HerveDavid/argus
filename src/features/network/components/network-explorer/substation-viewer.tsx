import React from 'react';
import SingleLineDiagram from '../single-line-diagram';

interface SubstationViewerProps {
  substationId?: string;
  substationDetails?: any; // TODO: Need to create an api
}

export const SubstationViewer: React.FC<SubstationViewerProps> = ({
  substationId,
  substationDetails,
}) => {
  return (
    <div className="w-10/12 flex flex-col overflow-hidden">
      <div className="flex items-center justify-center border-b border-gray-200">
        <h2 className="font-semibold p-2">
          {substationId ? `Substation: ${substationId}` : 'Select a substation'}
        </h2>
      </div>
      <div className="flex-1 overflow-auto p-4 bg-secondary">
        <div className="h-full w-full flex items-center justify-center border border-gray-200 rounded-md bg-background">
          {substationId && (
            <SingleLineDiagram
              lineId={substationId}
              className="w-auto h-auto max-w-full max-h-full bg-background"
            />
          )}
        </div>
      </div>
    </div>
  );
};
