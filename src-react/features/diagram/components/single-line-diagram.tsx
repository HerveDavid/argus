import { DiagramProvider } from '../providers/diagram.provider';
import { MetadataProvider } from '../providers/metadata.provider';
import { DiagramContent } from './diagram-content';

export const SingleLineDiagram = ({ elementId }: { elementId: string }) => {
  return (
    <MetadataProvider elementId={elementId}>
      <DiagramProvider>
        <DiagramContent />
      </DiagramProvider>
    </MetadataProvider>
  );
};
