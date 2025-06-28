import * as d3 from 'd3';
import { useCallback, useEffect, useRef } from 'react';

import { SldDiagram } from '@/types/sld-diagram';

export const useSvgRenderer = (
  diagramData: SldDiagram | null,
  isLoaded: boolean,
) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const setupZoom = useCallback(
    (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
          svg.select('g.zoom-group').attr('transform', event.transform);
        });

      svg.call(zoom).on('dblclick.zoom', null);
    },
    [],
  );

  const wrapContentInZoomGroup = useCallback(
    (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
      if (svg.select('g.zoom-group').empty()) {
        const content = svg.node()!.innerHTML;
        svg.node()!.innerHTML = '';
        const zoomGroup = svg.append('g').attr('class', 'zoom-group');
        zoomGroup.node()!.innerHTML = content;
      }
    },
    [],
  );

  const renderSvg = useCallback(async () => {
    // Vérifications plus strictes
    if (!isLoaded || !diagramData || !diagramData.svg || !svgRef.current) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    try {
      // Parse le SVG depuis le Blob
      const svgText = await diagramData.svg;

      if (!svgText || svgText.trim() === '') {
        console.error('Le contenu SVG est vide');
        return;
      }

      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');

      // Vérifier s'il y a des erreurs de parsing
      const parserError = svgDoc.querySelector('parsererror');
      if (parserError) {
        console.error('Erreur de parsing SVG:', parserError.textContent);
        return;
      }

      const svgElement = svgDoc.documentElement;

      if (!svgElement || svgElement.tagName !== 'svg') {
        console.error('Document SVG invalide');
        return;
      }

      // Configure les dimensions
      const viewBox = svgElement.getAttribute('viewBox');
      const originalWidth = svgElement.getAttribute('width');
      const originalHeight = svgElement.getAttribute('height');

      if (viewBox) {
        svg.attr('viewBox', viewBox);
      } else if (originalWidth && originalHeight) {
        svg.attr('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
      }

      // Importe le contenu
      svg.node()!.innerHTML = svgElement.innerHTML;

      // Configure les dimensions responsives
      svg.attr('width', '100%').attr('height', '100%');

      // Setup zoom et pan
      wrapContentInZoomGroup(svg);
      setupZoom(svg);
    } catch (error) {
      console.error('Erreur lors du rendu SVG:', error);
    }
  }, [isLoaded, diagramData, setupZoom, wrapContentInZoomGroup]);

  useEffect(() => {
    // Ajouter un délai pour s'assurer que les données sont complètement chargées
    if (isLoaded && diagramData && diagramData.svg) {
      const timeoutId = setTimeout(() => {
        renderSvg();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [renderSvg, isLoaded, diagramData]);

  return { svgRef };
};
