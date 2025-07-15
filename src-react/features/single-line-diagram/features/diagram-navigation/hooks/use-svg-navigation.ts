import * as d3 from 'd3';
import React, { useCallback, useRef } from 'react';

export const useSvgNavigation = () => {
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<
    SVGSVGElement,
    unknown
  > | null>(null);
  const currentTransformRef = useRef<d3.ZoomTransform | null>(null);

  const setupZoom = useCallback(
    (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
      if (zoomBehaviorRef.current) return zoomBehaviorRef.current;

      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 10])
        .on('start', (event) => {
          if (event.sourceEvent && event.sourceEvent.type === 'mousedown') {
            svg.style('cursor', 'move');
          }
        })
        .on('zoom', (event) => {
          currentTransformRef.current = event.transform;
          const zoomGroup = svg.select<SVGGElement>('g.zoom-group');
          if (!zoomGroup.empty()) {
            zoomGroup.attr('transform', event.transform);
          }
        })
        .on('end', (_) => {
          svg.style('cursor', 'default');
        });

      svg.call(zoom).on('dblclick.zoom', null);
      zoomBehaviorRef.current = zoom;
      return zoom;
    },
    [],
  );

  const restoreTransform = useCallback(
    (zoomGroup: d3.Selection<SVGGElement, unknown, null, undefined>) => {
      if (currentTransformRef.current) {
        zoomGroup.attr('transform', currentTransformRef.current.toString());
      }
    },
    [],
  );

  const cleanup = useCallback((svgRef: React.RefObject<SVGSVGElement>) => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).on('.zoom', null);
      zoomBehaviorRef.current = null;
    }
  }, []);

  return {
    setupZoom,
    restoreTransform,
    cleanup,
  };
};
