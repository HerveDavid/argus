import { useCallback, useEffect } from 'react';
import * as d3 from 'd3';
import { SldMetadata } from '@/types/sld-metadata';

interface DiagramFeedersProps {
  svgRef: React.RefObject<SVGSVGElement>;
  metadata?: SldMetadata;
}

export const useDiagramFeeders = ({
  svgRef,
  metadata,
}: DiagramFeedersProps) => {
  const initializeFeederValues = useCallback(() => {
    if (!svgRef.current) return;

    const svgElement = d3.select(svgRef.current);
    const feederInfoTextElements = svgElement.selectAll(
      '.sld-feeder-info .sld-label',
    );

    if (!feederInfoTextElements.empty()) {
      feederInfoTextElements.text('****');
    }
  }, [svgRef]);

  useEffect(() => {
    if (!svgRef.current) return;

    // Delay for waiting svg mounted
    const timer = setTimeout(() => {
      initializeFeederValues();
    }, 100);

    return () => clearTimeout(timer);
  }, [initializeFeederValues, metadata]);
};
