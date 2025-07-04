import { useCallback, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SldMetadata } from '@/types/sld-metadata';

interface DiagramFeedersProps {
  svgRef: React.RefObject<SVGSVGElement>;
  metadata?: SldMetadata;
  onInitialized?: () => void; // Callback quand l'initialisation est terminée
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
      console.log(
        `Initialized ${feederInfoTextElements.size()} feeder elements with ****`,
      );
      return true;
    }

    return false;
  }, [svgRef]);

  useEffect(() => {
    if (!svgRef.current || !metadata) return;

    // Ne réinitialiser que si les métadonnées ont vraiment changé
    const metadataChanged = lastMetadataRef.current !== metadata;

    if (metadataChanged) {
      console.log('Metadata changed, reinitializing feeders...');
      isInitializedRef.current = false;
      lastMetadataRef.current = metadata;
    }

    // Delay pour attendre que le SVG soit monté
    const timer = setTimeout(() => {
      if (!isInitializedRef.current) {
        const success = initializeFeederValues();
        if (success) {
          isInitializedRef.current = true;
          console.log('Feeders initialized successfully');
          onInitialized?.(); // Notifier que l'initialisation est terminée
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
