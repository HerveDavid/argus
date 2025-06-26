import { SldDiagram } from '@/types/sld-diagram';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Info } from 'lucide-react';

export const MetadataDisplay: React.FC<{ diagramData: SldDiagram | null }> = ({
  diagramData,
}) => {
  if (!diagramData) {
    return;
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer text-xs font-light text-muted-foreground hover:text-foreground transition-colors">
          <Info className="h-4 w-4" />
          <span>Metadata</span>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Elements:</span>
              <span className="text-primary">
                {diagramData.metadata?.components?.length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Nodes:</span>
              <span className="text-primary">
                {diagramData.metadata?.nodes?.length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Wires:</span>
              <span className="text-primary">
                {diagramData.metadata?.wires?.length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Feeders:</span>
              <span className="text-primary">
                {diagramData.metadata?.feederInfos?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
