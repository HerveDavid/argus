import { useEffect, RefObject } from 'react';
import * as d3 from 'd3';

export const useSvgManipulation = (
  svgContent: string | null,
  svgContainerRef: RefObject<HTMLDivElement>
) => {
  useEffect(() => {
    if (svgContent && svgContainerRef.current) {
      const svgElement = svgContainerRef.current.querySelector('svg');

      if (svgElement) {
        // Appliquer la police système à tous les éléments textuels du SVG
        d3.select(svgElement).selectAll('text').style('font-family', 'inherit');

        // S'assurer que le SVG s'adapte parfaitement au conteneur
        d3.select(svgElement)
          .attr('width', '100%')
          .attr('height', '100%')
          .attr('preserveAspectRatio', 'xMidYMid meet')
          .style('max-width', '100%')
          .style('max-height', '100%')
          .style('overflow', 'hidden');

        // Trouver ou créer le viewBox
        const viewBox = svgElement.getAttribute('viewBox');
        if (!viewBox) {
          const bbox = (svgElement as SVGSVGElement).getBBox();
          // Ajouter un peu de padding pour s'assurer que le contenu est visible
          const padding = 5;
          svgElement.setAttribute(
            'viewBox',
            `${bbox.x - padding} ${bbox.y - padding} ${
              bbox.width + padding * 2
            } ${bbox.height + padding * 2}`,
          );
        }

        // S'assurer que le SVG s'adapte parfaitement au conteneur
        const containerWidth = svgContainerRef.current.clientWidth;
        const containerHeight = svgContainerRef.current.clientHeight;

        if (containerWidth && containerHeight) {
          // Définir le viewBox pour maintenir le ratio d'aspect
          const currentViewBox = svgElement
            .getAttribute('viewBox')
            ?.split(' ')
            .map(Number) || [0, 0, 100, 100];
          const viewBoxWidth = currentViewBox[2];
          const viewBoxHeight = currentViewBox[3];

          const svgAspectRatio = viewBoxWidth / viewBoxHeight;
          const containerAspectRatio = containerWidth / containerHeight;

          if (containerAspectRatio > svgAspectRatio) {
            // Le conteneur est plus large que le SVG
            const newWidth = viewBoxHeight * containerAspectRatio;
            const xOffset = (newWidth - viewBoxWidth) / 2;
            svgElement.setAttribute(
              'viewBox',
              `${currentViewBox[0] - xOffset} ${
                currentViewBox[1]
              } ${newWidth} ${viewBoxHeight}`,
            );
          } else {
            // Le conteneur est plus haut que le SVG
            const newHeight = viewBoxWidth / containerAspectRatio;
            const yOffset = (newHeight - viewBoxHeight) / 2;
            svgElement.setAttribute(
              'viewBox',
              `${currentViewBox[0]} ${
                currentViewBox[1] - yOffset
              } ${viewBoxWidth} ${newHeight}`,
            );
          }
        }
      }
    }
  }, [svgContent, svgContainerRef]);
};