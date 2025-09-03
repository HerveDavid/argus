import { Result } from '@effect-atom/atom-react';
import { useMetadata } from '../providers/metadata.provider';
import { useDiagram } from '../providers/diagram.provider';
import { SvgRender } from './svg-render';

export const DiagramContent = () => {
  const { metadata } = useMetadata();
  const { svgRef } = useDiagram();

  return Result.matchWithWaiting(metadata, {
    onDefect: () => <></>,
    onError: (err) => <>{JSON.stringify(err)}</>,
    onSuccess: () => <SvgRender svgRef={svgRef} />,
    onWaiting: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg">Loading diagram...</p>
        </div>
      </div>
    ),
  });
};
