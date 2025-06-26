import { SldDiagram } from '@/types/sld-diagram';

export const MetadataDisplay: React.FC<{ diagramData: SldDiagram }> = ({
  diagramData,
}) => (
  <div className="mt-4 p-3 bg-muted rounded-lg">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
      <div>
        <span className="font-medium">Elements: </span>
        <span className="text-primary">
          {diagramData.metadata?.components?.length || 0}
        </span>
      </div>
      <div>
        <span className="font-medium">Nodes: </span>
        <span className="text-primary">
          {diagramData.metadata?.nodes?.length || 0}
        </span>
      </div>
      <div>
        <span className="font-medium">Wires: </span>
        <span className="text-primary">
          {diagramData.metadata?.wires?.length || 0}
        </span>
      </div>
      <div>
        <span className="font-medium">Feeders: </span>
        <span className="text-primary">
          {diagramData.metadata?.feederInfos?.length || 0}
        </span>
      </div>
    </div>
  </div>
);
