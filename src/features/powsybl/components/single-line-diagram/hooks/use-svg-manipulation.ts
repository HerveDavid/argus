import { useEffect, RefObject } from 'react';
import * as d3 from 'd3';

export const useSvgManipulation = (
  svgContent: string | null,
  svgContainerRef: RefObject<HTMLDivElement>,
) => {
  useEffect(() => {
    if (!svgContent || !svgContainerRef.current) return;

    const containerElement = svgContainerRef.current;

    // Fonction pour ajuster le SVG
    const adjustSvg = (
      svgElement: SVGSVGElement,
      containerElement: HTMLDivElement,
    ) => {
      // Appliquer la police système à tous les éléments textuels du SVG
      d3.select(svgElement).selectAll('text').style('font-family', 'inherit');

      // Configurer le SVG pour qu'il soit responsive
      const svg = d3
        .select(svgElement)
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('max-width', '100%')
        .style('max-height', '100%')
        .style('display', 'block'); // Important pour éviter les espaces blancs

      // Calculer et appliquer le viewBox approprié
      const computeViewBox = () => {
        let viewBox = svgElement.getAttribute('viewBox');

        if (!viewBox) {
          try {
            const bbox = svgElement.getBBox();
            // Ajouter un padding pour s'assurer que tout le contenu est visible
            const padding = 10;
            viewBox = `${bbox.x - padding} ${bbox.y - padding} ${
              bbox.width + padding * 2
            } ${bbox.height + padding * 2}`;
            svgElement.setAttribute('viewBox', viewBox);
          } catch (e) {
            console.warn('Could not compute SVG bounding box:', e);
            return;
          }
        }

        // Ajuster le viewBox en fonction des dimensions du conteneur
        const containerWidth = containerElement.clientWidth;
        const containerHeight = containerElement.clientHeight;

        if (containerWidth && containerHeight) {
          const viewBoxArray = viewBox.split(' ').map(Number);
          const [vbX, vbY, vbWidth, vbHeight] = viewBoxArray;

          const svgAspectRatio = vbWidth / vbHeight;
          const containerAspectRatio = containerWidth / containerHeight;

          let newViewBox;
          if (containerAspectRatio > svgAspectRatio) {
            // Le conteneur est plus large que le SVG
            const newWidth = vbHeight * containerAspectRatio;
            const xOffset = (newWidth - vbWidth) / 2;
            newViewBox = `${vbX - xOffset} ${vbY} ${newWidth} ${vbHeight}`;
          } else {
            // Le conteneur est plus haut que le SVG
            const newHeight = vbWidth / containerAspectRatio;
            const yOffset = (newHeight - vbHeight) / 2;
            newViewBox = `${vbX} ${vbY - yOffset} ${vbWidth} ${newHeight}`;
          }

          svgElement.setAttribute('viewBox', newViewBox);
        }
      };

      // Calculer le viewBox après un court délai pour s'assurer que tout est rendu
      setTimeout(computeViewBox, 0);

      // Recalculer lors du redimensionnement
      const resizeObserver = new ResizeObserver(() => {
        computeViewBox();
      });

      resizeObserver.observe(containerElement);

      // Cleanup
      return () => {
        resizeObserver.disconnect();
      };
    };

    // Utiliser un MutationObserver pour détecter quand le SVG est ajouté au DOM
    const observer = new MutationObserver((mutations) => {
      const svgElement = containerElement.querySelector('svg');
      if (svgElement && svgElement instanceof SVGSVGElement) {
        // Arrêter d'observer une fois le SVG trouvé
        observer.disconnect();

        // Attendre que le SVG soit complètement rendu
        requestAnimationFrame(() => {
          adjustSvg(svgElement, containerElement);
        });
      }
    });

    // Observer les changements dans le conteneur
    observer.observe(containerElement, { childList: true, subtree: true });

    // Essayer d'ajuster immédiatement si le SVG est déjà présent
    const svgElement = containerElement.querySelector('svg');
    if (svgElement && svgElement instanceof SVGSVGElement) {
      adjustSvg(svgElement, containerElement);
    }

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [svgContent, svgContainerRef]);
};
