import { Result } from '@effect-atom/atom-react';
import { useMetadata } from '../providers/metadata.provider';
import { useDiagram } from '../providers/diagram.provider';
import { FeedersProvider } from '../providers/feeders.provider';

export const DiagramContent = () => {
  const { metadata } = useMetadata();
  const { svgRef } = useDiagram();

  return Result.matchWithWaiting(metadata, {
    onDefect: () => <>Loading</>,
    onError: (err) => <>{JSON.stringify(err)}</>,
    onSuccess: () => <SvgContent svgRef={svgRef} />,
    onWaiting: () => <>Waiting</>,
  });
};

const SvgContent = ({ svgRef }: { svgRef: React.RefObject<SVGSVGElement> }) => (
  <FeedersProvider>
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-hidden bg-background border-0 rounded">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-default"
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  </FeedersProvider>
);
