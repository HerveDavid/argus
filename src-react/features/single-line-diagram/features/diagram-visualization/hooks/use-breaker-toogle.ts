import { useCallback } from 'react';
import * as d3 from 'd3';

export const useBreakerToggle = (svgRef: React.RefObject<SVGSVGElement>) => {
  const toggleBreaker = useCallback(
    (breakerId: string, isClosed: boolean) => {
      if (!svgRef.current || !breakerId) return;

      const element = d3
        .select(svgRef.current)
        .select<SVGElement>(`#${breakerId}`);

      if (element.empty()) return;

      const node = element.node();
      if (!(node instanceof SVGElement)) return;

      // Changement d'état
      if (isClosed) {
        node.classList.remove('sld-closed');
        node.classList.add('sld-open');
      } else {
        node.classList.remove('sld-open');
        node.classList.add('sld-closed');
      }

      // Effet visuel subtil
      element
        .style('opacity', 0.8)
        .transition()
        .duration(100)
        .style('opacity', 1);
    },
    [svgRef],
  );

  return { toggleBreaker };
};
