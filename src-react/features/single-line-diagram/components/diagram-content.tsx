import { SldDiagram } from '@/types/sld-diagram';
import { MetadataDisplay } from './metadata-display';

export const DiagramContent: React.FC<{
  diagramData: SldDiagram;
  svgRef: React.RefObject<SVGSVGElement>;
}> = ({ diagramData, svgRef }) => (
  <div className="h-full flex flex-col">
    <div className="flex-1 overflow-hidden bg-muted/25 border-1 rounded">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
    <MetadataDisplay diagramData={diagramData} />
  </div>
);
