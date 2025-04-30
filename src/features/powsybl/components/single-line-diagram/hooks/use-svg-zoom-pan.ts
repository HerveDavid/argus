import { useEffect, RefObject } from 'react';
import { SVG, Svg } from '@svgdotjs/svg.js';

interface ZoomPanOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomFactor?: number;
  panEnabled?: boolean;
  zoomEnabled?: boolean;
  wheelZoomEnabled?: boolean;
  initialZoom?: number;
  onZoom?: (zoomLevel: number) => void;
  onPan?: (x: number, y: number) => void;
}

export const useSvgZoomPan = (
  containerRef: RefObject<HTMLDivElement>,
  options: ZoomPanOptions = {},
) => {
  const {
    minZoom = 0.5,
    maxZoom = 3,
    zoomFactor = 0.1,
    panEnabled = true,
    zoomEnabled = true,
    wheelZoomEnabled = true,
    initialZoom = 1,
    onZoom,
    onPan,
  } = options;

  useEffect(() => {
    if (!containerRef.current) return;

    let svgInstance: Svg | null = null;
    let isPanning = false;
    let startPoint = { x: 0, y: 0 };
    let viewBox = { x: 0, y: 0, width: 0, height: 0 };
    let currentZoom = initialZoom;

    // Fonction pour initialiser le SVG
    const initSvg = (svgElement: SVGSVGElement) => {
      if (!svgElement) return null;

      // Créer une instance SVG.js à partir de l'élément SVG existant
      svgInstance = SVG(svgElement);

      // Obtenir le viewBox initial
      const vb = svgElement.viewBox.baseVal;
      if (vb.width && vb.height) {
        viewBox = { x: vb.x, y: vb.y, width: vb.width, height: vb.height };
      } else {
        // Fallback si viewBox n'est pas défini
        const width = svgElement.width.baseVal.value || svgElement.clientWidth;
        const height =
          svgElement.height.baseVal.value || svgElement.clientHeight;
        viewBox = { x: 0, y: 0, width, height };
        svgInstance.viewbox(0, 0, width, height);
      }

      // Appliquer le zoom initial
      if (initialZoom !== 1) {
        applyZoom(initialZoom);
      }

      return svgInstance;
    };

    // Fonction pour appliquer le zoom
    const applyZoom = (zoom: number, centerX?: number, centerY?: number) => {
      if (!svgInstance) return;

      const newZoom = Math.min(Math.max(zoom, minZoom), maxZoom);

      // Si le niveau de zoom n'a pas changé, ne rien faire
      if (newZoom === currentZoom) return;

      const svgElement = svgInstance.node;
      const svgRect = svgElement.getBoundingClientRect();

      // Déterminer le centre du zoom
      const cx = centerX !== undefined ? centerX : svgRect.width / 2;
      const cy = centerY !== undefined ? centerY : svgRect.height / 2;

      // Calculer le point dans les coordonnées du viewBox
      const pt = svgElement.createSVGPoint();
      pt.x = cx;
      pt.y = cy;
      const svgP = pt.matrixTransform(svgElement.getScreenCTM()?.inverse());

      // Calculer le nouveau viewBox
      const zoomRatio = currentZoom / newZoom;
      const newWidth = viewBox.width * zoomRatio;
      const newHeight = viewBox.height * zoomRatio;

      // Ajuster la position pour que le zoom soit centré sur le point
      const newX = svgP.x - (svgP.x - viewBox.x) * zoomRatio;
      const newY = svgP.y - (svgP.y - viewBox.y) * zoomRatio;

      // Appliquer le nouveau viewBox
      svgInstance.viewbox(newX, newY, newWidth, newHeight);

      // Mettre à jour les variables
      viewBox = { x: newX, y: newY, width: newWidth, height: newHeight };
      currentZoom = newZoom;

      // Appeler le callback si défini
      if (onZoom) onZoom(currentZoom);
    };

    // Gestionnaire d'événement de la molette
    const handleWheel = (e: WheelEvent) => {
      if (!wheelZoomEnabled || !zoomEnabled || !svgInstance) return;

      e.preventDefault();

      // Déterminer la direction du zoom
      const delta = e.deltaY < 0 ? 1 : -1;
      const zoomDelta = delta * zoomFactor;
      const newZoom = currentZoom * (1 + zoomDelta);

      // Appliquer le zoom centré sur la position de la souris
      applyZoom(newZoom, e.clientX, e.clientY);
    };

    // Gestionnaire d'événement pour commencer le panoramique
    const handleMouseDown = (e: MouseEvent) => {
      if (!panEnabled || !svgInstance || e.button !== 0) return;

      e.preventDefault();

      isPanning = true;
      startPoint = { x: e.clientX, y: e.clientY };

      // Ajouter la classe pour le curseur grab
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
      }
    };

    // Gestionnaire d'événement pour le panoramique en cours
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning || !svgInstance) return;

      e.preventDefault();

      const dx = e.clientX - startPoint.x;
      const dy = e.clientY - startPoint.y;

      // Convertir le déplacement en coordonnées du viewBox
      const svgElement = svgInstance.node;
      const scale = viewBox.width / svgElement.clientWidth;

      const newX = viewBox.x - dx * scale;
      const newY = viewBox.y - dy * scale;

      // Appliquer le nouveau viewBox
      svgInstance.viewbox(newX, newY, viewBox.width, viewBox.height);

      // Mettre à jour les variables
      viewBox.x = newX;
      viewBox.y = newY;
      startPoint = { x: e.clientX, y: e.clientY };

      // Appeler le callback si défini
      if (onPan) onPan(newX, newY);
    };

    // Gestionnaire d'événement pour terminer le panoramique
    const handleMouseUp = () => {
      isPanning = false;

      // Restaurer le curseur
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grab';
      }
    };

    // Fonction pour réinitialiser le zoom
    const resetZoom = () => {
      if (!svgInstance) return;

      const svgElement = svgInstance.node;
      const vb = svgElement.viewBox.baseVal;

      viewBox = { x: vb.x, y: vb.y, width: vb.width, height: vb.height };
      currentZoom = 1;

      svgInstance.viewbox(viewBox.x, viewBox.y, viewBox.width, viewBox.height);

      if (onZoom) onZoom(1);
    };

    // Observer pour surveiller quand le SVG est ajouté au DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const svgElement = containerRef.current?.querySelector('svg');
          if (svgElement && !svgInstance) {
            svgInstance = initSvg(svgElement);

            // Ajouter les gestionnaires d'événements
            if (wheelZoomEnabled) {
              containerRef.current?.addEventListener('wheel', handleWheel, {
                passive: false,
              });
            }

            if (panEnabled) {
              containerRef.current?.addEventListener(
                'mousedown',
                handleMouseDown,
              );
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);

              // Ajouter la classe pour le curseur grab
              if (containerRef.current) {
                containerRef.current.style.cursor = 'grab';
              }
            }
          }
        }
      });
    });

    // Commencer à observer
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });

      // Vérifier si le SVG existe déjà
      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        svgInstance = initSvg(svgElement);

        // Ajouter les gestionnaires d'événements
        if (wheelZoomEnabled) {
          containerRef.current.addEventListener('wheel', handleWheel, {
            passive: false,
          });
        }

        if (panEnabled) {
          containerRef.current.addEventListener('mousedown', handleMouseDown);
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);

          // Ajouter la classe pour le curseur grab
          containerRef.current.style.cursor = 'grab';
        }
      }
    }

    // Nettoyer les gestionnaires d'événements lors du démontage
    return () => {
      observer.disconnect();

      if (containerRef.current) {
        containerRef.current.removeEventListener('wheel', handleWheel);
        containerRef.current.removeEventListener('mousedown', handleMouseDown);
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef, options]);

  // Retourner les méthodes pour contrôler le zoom et le panoramique à partir du composant
  return {
    zoomIn: () => {
      const svgElement = containerRef.current?.querySelector('svg');
      if (svgElement) {
        const svg = SVG(svgElement);
        const vb = svg.viewbox();

        // Calculer le nouveau zoom
        const zoomFactor = options.zoomFactor || 0.1;
        const newZoomFactor = 1 + zoomFactor;

        // Calculer le nouveau viewBox
        const newWidth = vb.width / newZoomFactor;
        const newHeight = vb.height / newZoomFactor;

        // Centrer le zoom
        const newX = vb.x + (vb.width - newWidth) / 2;
        const newY = vb.y + (vb.height - newHeight) / 2;

        // Appliquer le nouveau viewBox
        svg.viewbox(newX, newY, newWidth, newHeight);

        // Calculer le niveau de zoom approximatif
        const svgNative = svgElement as SVGSVGElement;
        const origWidth = svgNative.viewBox.baseVal.width;
        const currentZoom = origWidth / newWidth;

        if (options.onZoom) options.onZoom(currentZoom);
      }
    },
    zoomOut: () => {
      const svgElement = containerRef.current?.querySelector('svg');
      if (svgElement) {
        const svg = SVG(svgElement);
        const vb = svg.viewbox();

        // Calculer le nouveau zoom
        const zoomFactor = options.zoomFactor || 0.1;
        const newZoomFactor = 1 - zoomFactor;

        // Calculer le nouveau viewBox
        const newWidth = vb.width / newZoomFactor;
        const newHeight = vb.height / newZoomFactor;

        // Centrer le zoom
        const newX = vb.x + (vb.width - newWidth) / 2;
        const newY = vb.y + (vb.height - newHeight) / 2;

        // Appliquer le nouveau viewBox
        svg.viewbox(newX, newY, newWidth, newHeight);

        // Calculer le niveau de zoom approximatif
        const svgNative = svgElement as SVGSVGElement;
        const origWidth = svgNative.viewBox.baseVal.width;
        const currentZoom = origWidth / newWidth;

        if (options.onZoom) options.onZoom(currentZoom);
      }
    },
    resetZoom: () => {
      const svgElement = containerRef.current?.querySelector('svg');
      if (svgElement) {
        const svg = SVG(svgElement);
        const svgNative = svgElement as SVGSVGElement;

        // Restaurer le viewBox d'origine si disponible
        if (svgNative.viewBox.baseVal) {
          const originalVB = svgNative.viewBox.baseVal;
          svg.viewbox(
            originalVB.x,
            originalVB.y,
            originalVB.width,
            originalVB.height,
          );
        } else {
          // Sinon, utiliser les dimensions actuelles du SVG
          svg.viewbox(
            0,
            0,
            svgNative.width.baseVal.value,
            svgNative.height.baseVal.value,
          );
        }

        if (options.onZoom) options.onZoom(1);
      }
    },
    fitContent: () => {
      const svgElement = containerRef.current?.querySelector('svg');
      if (svgElement) {
        const svg = SVG(svgElement);

        // Trouver les limites de tous les éléments dans le SVG
        const bbox = svg.bbox();

        // Ajouter une marge
        const margin = 20;
        const viewbox = {
          x: bbox.x - margin,
          y: bbox.y - margin,
          width: bbox.width + 2 * margin,
          height: bbox.height + 2 * margin,
        };

        // Appliquer le viewBox
        svg.viewbox(viewbox.x, viewbox.y, viewbox.width, viewbox.height);
      }
    },
  };
};
