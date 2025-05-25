import { useEffect, RefObject, useCallback } from 'react';
import * as d3 from 'd3';

export const useSvgZoomPan = (
  svgContent: string | null,
  svgContainerRef: RefObject<HTMLDivElement>,
) => {
  // Définir le comportement de zoom
  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 10]) // Limiter le zoom entre 10% et 1000%
    .on('zoom', (event) => {
      const { transform } = event;
      // Trouver le SVG parent
      let target = event.sourceEvent?.target;
      while (target && target.tagName !== 'svg') {
        target = target.parentElement;
      }

      if (!target) return;

      const svg = d3.select(target as SVGSVGElement);
      // Appliquer la transformation au groupe principal du SVG
      svg.select('g').attr('transform', transform.toString());
    });

  // Fonction pour réinitialiser le zoom et centrer le SVG
  const resetZoom = useCallback(
    (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
      const svgElement = svg.node();
      if (!svgElement) return;

      // Obtenir les dimensions du conteneur et du SVG
      const containerElement = svgContainerRef.current;
      if (!containerElement) return;

      const containerRect = containerElement.getBoundingClientRect();
      const svgRect = svgElement.getBoundingClientRect();

      // Calculer les facteurs d'échelle pour adapter le SVG au conteneur
      const scaleX = containerRect.width / svgRect.width;
      const scaleY = containerRect.height / svgRect.height;
      const scale = Math.min(scaleX, scaleY) * 0.9; // 0.9 pour une marge

      // Calculer la translation pour centrer le SVG
      const translateX = (containerRect.width - svgRect.width * scale) / 2;
      const translateY = (containerRect.height - svgRect.height * scale) / 2;

      // Appliquer la transformation
      svg
        .transition()
        .duration(750)
        .call(
          zoom.transform as any,
          d3.zoomIdentity.translate(translateX, translateY).scale(scale),
        );
    },
    [svgContainerRef, zoom],
  );

  useEffect(() => {
    if (!svgContent || !svgContainerRef.current) return;

    // Fonction pour initialiser le zoom et le pan
    const initializeZoomPan = (
      svgElement: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    ) => {
      // Configurer les dimensions pour être responsive
      svgElement
        .attr('width', '100%')
        .attr('height', '100%')
        .style('display', 'block')
        .style('overflow', 'visible');

      // S'assurer qu'il y a un groupe principal qui contient tout le contenu
      let mainGroup = svgElement.select<SVGGElement>('g');
      if (mainGroup.empty()) {
        // Si pas de groupe principal, en créer un et y déplacer tout le contenu
        mainGroup = svgElement.append('g');
        const children = Array.from(svgElement.node()?.children || []).filter(
          (child) => child.tagName !== 'g',
        );
        children.forEach((child) => mainGroup.append(() => child));
      }

      // Appliquer le comportement de zoom
      svgElement.call(zoom);

      // // Double-clic pour réinitialiser le zoom
      // svgElement.on('dblclick.zoom', () => {
      //   resetZoom(svgElement);
      // });

      // Centrer et adapter le SVG au chargement initial
      resetZoom(svgElement);

      // Gérer le redimensionnement de la fenêtre
      const handleResize = () => {
        resetZoom(svgElement);
      };

      window.addEventListener('resize', handleResize);

      // Cleanup
      return () => {
        svgElement.on('.zoom', null);
        window.removeEventListener('resize', handleResize);
      };
    };

    // Utiliser un MutationObserver pour détecter quand le SVG est ajouté au DOM
    const observer = new MutationObserver((mutations) => {
      const container = d3.select(svgContainerRef.current);
      const svgElement = container.select<SVGSVGElement>('svg');

      if (!svgElement.empty()) {
        observer.disconnect();
        initializeZoomPan(svgElement);
      }
    });

    // Observer les changements dans le conteneur
    if (svgContainerRef.current) {
      observer.observe(svgContainerRef.current, {
        childList: true,
        subtree: true,
      });
    }

    // Vérifier si le SVG est déjà dans le DOM
    const container = d3.select(svgContainerRef.current);
    const initialSvg = container.select<SVGSVGElement>('svg');

    if (!initialSvg.empty()) {
      initializeZoomPan(initialSvg);
    }

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [svgContent, svgContainerRef, resetZoom, zoom]);

  return { resetZoom };
};
