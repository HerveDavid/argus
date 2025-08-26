import { Result } from '@effect-atom/atom-react';
import { useMetadata } from '../providers/metadata.provider';
import { useDiagram } from '../providers/diagram.provider';
import { SvgRender } from './svg-render';

export const DiagramContent = () => {
  const { metadata } = useMetadata();
  const { svgRef } = useDiagram();

  return Result.matchWithWaiting(metadata, {
    onDefect: () => <>Loading</>,
    onError: (err) => <>{JSON.stringify(err)}</>,
    onSuccess: () => <SvgRender svgRef={svgRef} />,
    onWaiting: () => <>Waiting</>,
  });
};
