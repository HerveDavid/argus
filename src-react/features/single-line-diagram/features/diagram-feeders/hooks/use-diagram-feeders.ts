import * as d3 from 'd3';
import React, { useCallback, useEffect, useRef } from 'react';

import { SldMetadata } from '@/types/sld-metadata';

interface DiagramFeedersProps {
  svgRef: React.RefObject<SVGSVGElement>;
  metadata?: SldMetadata;
  onInitialized?: () => void;
}

export const useDiagramFeeders = ({
  svgRef,
  metadata,
  onInitialized,
}: DiagramFeedersProps) => {
  const isInitializedRef = useRef(false);
  const lastMetadataRef = useRef<SldMetadata | undefined>();

  const initializeFeederValues = useCallback(() => {
    if (!svgRef.current) return false;

    const svgElement = d3.select(svgRef.current);
    const feederInfoTextElements = svgElement.selectAll(
      '.sld-feeder-info .sld-label',
    );

    if (!feederInfoTextElements.empty()) {
      feederInfoTextElements.text('****');
      return true;
    }

    return false;
  }, [svgRef]);

  useEffect(() => {
    if (!svgRef.current || !metadata) return;

    const metadataChanged = lastMetadataRef.current !== metadata;

    if (metadataChanged) {
      isInitializedRef.current = false;
      lastMetadataRef.current = metadata;
    }

    const timer = setTimeout(() => {
      if (!isInitializedRef.current) {
        const success = initializeFeederValues();
        if (success) {
          isInitializedRef.current = true;
          onInitialized?.();
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [svgRef, metadata, initializeFeederValues, onInitialized]);

  return {
    isInitialized: isInitializedRef.current,
    reinitialize: () => {
      isInitializedRef.current = false;
    },
  };
};
