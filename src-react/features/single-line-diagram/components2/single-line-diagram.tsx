import React from 'react';
import { DiagramProvider } from '../providers/diagram.provider';
import { DiagramContent } from './diagram-content';

interface SingleLineDiagramProps {
  id: string;
}

export const SingleLineDiagram: React.FC<SingleLineDiagramProps> = ({ id }) => {
  return (
    <DiagramProvider elementId={id} key={id}>
      <DiagramContent />
    </DiagramProvider>
  );
};
