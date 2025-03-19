import { useEffect, useState, useRef } from 'react';
import { useDiagramStore } from '../../stores/use-diagram.store';
import * as d3 from 'd3';
import ContextMenu from './context-menu';

// Import uniquement des styles d'animation
import './diagram-animations.css';

interface SingleLineDiagramProps {
  lineId: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}

const SingleLineDiagram: React.FC<SingleLineDiagramProps> = ({
  lineId,
  width = '100%',
  height = 'auto',
  className = '',
}: SingleLineDiagramProps) => {
  const { svgBlob, isLoading, error, loadDiagram, resetDiagram } =
    useDiagramStore();
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetElement: SVGElement | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    targetElement: null,
  });

  useEffect(() => {
    loadDiagram(lineId);
    return () => {
      resetDiagram();
    };
  }, [lineId, loadDiagram, resetDiagram]);

  useEffect(() => {
    if (svgBlob) {
      svgBlob.text().then((text) => {
        setSvgContent(text);
      });
    } else {
      setSvgContent(null);
    }
  }, [svgBlob]);

  // Fonction améliorée pour appliquer l'effet de clignotement
  const applyBlinkEffect = (element: SVGElement, isClosing: boolean) => {
    // Déterminer quelle animation appliquer
    const animationClass = isClosing
      ? 'sld-switching-close'
      : 'sld-switching-open';

    // Appliquer la classe d'animation
    element.classList.add('sld-switching', animationClass);

    // Nettoyer après la fin de l'animation
    setTimeout(() => {
      element.classList.remove('sld-switching', animationClass);
    }, 650); // Légèrement plus long que la durée de l'animation
  };

  // Fonction modifiée pour basculer l'état d'un disjoncteur avec effet de clignotement
  const toggleBreaker = (breakerId: string, isClosed: boolean) => {
    if (!svgContainerRef.current) return;

    // Trouver l'élément du disjoncteur par son ID
    const breakerElement = svgContainerRef.current.querySelector(
      `#${breakerId}`,
    );
    if (!breakerElement || !(breakerElement instanceof SVGElement)) return;

    // Appliquer l'effet de clignotement
    applyBlinkEffect(breakerElement, !isClosed);

    // Changer l'état après un court délai pour que l'effet soit visible
    setTimeout(() => {
      if (isClosed) {
        // Si fermé → ouvrir
        breakerElement.classList.remove('sld-closed');
        breakerElement.classList.add('sld-open');
      } else {
        // Si ouvert → fermer
        breakerElement.classList.remove('sld-open');
        breakerElement.classList.add('sld-closed');
      }
    }, 600); // Le délai correspond à la durée de l'animation

    // Fermer le menu contextuel
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  // Effect for SVG manipulation with Tailwind font integration
  useEffect(() => {
    if (svgContent && svgContainerRef.current) {
      const svgElement = svgContainerRef.current.querySelector('svg');

      if (svgElement) {
        // Appliquer la police système à tous les éléments textuels du SVG
        d3.select(svgElement).selectAll('text').style('font-family', 'inherit'); // Utilise la police héritée de l'élément parent

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

      // Ajouter les écouteurs d'événements pour le menu contextuel et les effets de survol
      const addEventListeners = () => {
        if (svgContainerRef.current) {
          // Ajouter le menu contextuel à tous les éléments SVG
          const svgElements =
            svgContainerRef.current.querySelectorAll('svg, svg *');
          svgElements.forEach((element) => {
            element.addEventListener(
              'contextmenu',
              handleContextMenu as EventListener,
            );
          });

          // Ajouter l'effet de survol aux éléments sld-label
          const labelElements =
            svgContainerRef.current.querySelectorAll('.sld-label');
          labelElements.forEach((label) => {
            // Sauvegarder le style original
            const originalFill = label.getAttribute('fill') || 'black';
            const originalFont = label.getAttribute('font') || '';

            // Ajouter les effets de survol
            label.addEventListener('mouseenter', () => {
              label.setAttribute('fill', '#FF5500');
              label.setAttribute('font-weight', 'bold');
              if (label instanceof SVGElement || label instanceof HTMLElement) {
                label.style.cursor = 'pointer';
              }
            });

            label.addEventListener('mouseleave', () => {
              label.setAttribute('fill', originalFill);
              label.setAttribute('font-weight', 'normal');
              if (originalFont) {
                label.setAttribute('font', originalFont);
              }
            });

            // Ajouter l'événement de clic pour les étiquettes
            label.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();

              // Obtenir le texte de l'étiquette
              const labelText: string = label.textContent || '';

              // Afficher une infobulle ou effectuer une action lors du clic sur l'étiquette
              handleContextMenu(e, true, label as SVGElement, labelText);
            });
          });

          // Ajouter l'effet de survol et la gestion des clics aux disjoncteurs et sectionneurs
          const switchableElements = svgContainerRef.current.querySelectorAll(
            '.sld-breaker, .sld-disconnector',
          );

          switchableElements.forEach((element) => {
            element.addEventListener('mouseenter', () => {
              if (
                element instanceof SVGElement ||
                element instanceof HTMLElement
              ) {
                element.style.cursor = 'pointer';
                element.style.filter = 'brightness(1.2)';
              }
            });

            element.addEventListener('mouseleave', () => {
              if (
                element instanceof SVGElement ||
                element instanceof HTMLElement
              ) {
                // Ne pas réinitialiser le filtre si l'animation est en cours
                if (!element.classList.contains('sld-switching')) {
                  element.style.filter = 'none';
                }
              }
            });

            // Ajouter l'événement de clic pour basculer directement
            element.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();

              // Trouver le parent qui contient l'ID
              const switchGroup = findParentWithId(element as Element);

              if (switchGroup && switchGroup.id) {
                const isClosed = switchGroup.classList.contains('sld-closed');
                toggleBreaker(switchGroup.id, isClosed);
              }
            });
          });
        }
      };

      // Fonction pour trouver le parent avec un ID
      const findParentWithId = (element: Element): Element | null => {
        let current = element;
        while (current && !current.id) {
          if (current.parentElement) {
            current = current.parentElement;
          } else {
            return null;
          }
        }
        return current;
      };

      // Ajouter tous les écouteurs d'événements
      addEventListeners();

      // Fonction de nettoyage
      return () => {
        if (svgContainerRef.current) {
          const svgElements =
            svgContainerRef.current.querySelectorAll('svg, svg *');

          svgElements.forEach((element) => {
            element.removeEventListener(
              'contextmenu',
              handleContextMenu as EventListener,
            );
          });
        }
      };
    }
  }, [svgContent]);

  // Gérer les événements du menu contextuel (clic droit ou clic sur l'étiquette)
  const handleContextMenu = (
    e: Event,
    isLabelClick = false,
    labelElement: SVGElement | null = null,
    labelText = '',
  ) => {
    e.preventDefault();
    const mouseEvent = e as MouseEvent;

    // Obtenir les coordonnées relatives au conteneur SVG
    const containerRect = svgContainerRef.current?.getBoundingClientRect();

    if (containerRect) {
      // Calculer les coordonnées relatives au conteneur
      const relativeX = mouseEvent.clientX - containerRect.left;
      const relativeY = mouseEvent.clientY - containerRect.top;

      // Si c'est un clic sur une étiquette, utiliser l'étiquette comme cible
      // sinon utiliser l'élément ciblé par l'événement
      const targetElement = isLabelClick
        ? labelElement
        : (e.target as SVGElement | null);

      // Trouver le parent le plus proche qui contient un ID si la cible n'est pas une étiquette
      let element: SVGElement | null = targetElement;
      if (!isLabelClick && element) {
        while (element && !element.id && element.parentElement) {
          element = element.parentElement as SVGElement;
        }
      }

      setContextMenu({
        visible: true,
        x: relativeX,
        y: relativeY,
        targetElement: element || targetElement,
      });
    }
  };

  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40 font-sans">
        Loading diagram...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 font-sans">{error}</div>;
  }

  if (svgContent) {
    return (
      <div
        ref={svgContainerRef}
        className={`relative font-sans ${className}`}
        style={{
          width,
          height,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />

        {contextMenu.visible && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            targetElement={contextMenu.targetElement}
            onClose={closeContextMenu}
            onToggleBreaker={toggleBreaker}
          />
        )}

        {/* Légende pour les disjoncteurs avec classes Tailwind */}
        <div className="absolute bottom-2 right-2 bg-white p-2 rounded shadow-md text-xs font-sans">
          <div className="font-semibold mb-1">Interactions:</div>
          <div className="flex items-center mb-1">
            <div className="w-4 h-4 mr-1 border border-blue-500 flex items-center justify-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <span>Clic = Ouvrir/Fermer disjoncteur</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-1 border border-gray-500 flex items-center justify-center">
              <span className="text-xs">🖱️</span>
            </div>
            <span>Clic droit = Menu contextuel</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center h-40 text-gray-500 font-sans">
      <p>Forbidden diagram</p>
      <button
        className="mt-2 px-4 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
        onClick={() => loadDiagram(lineId)}
      >
        Reload
      </button>
    </div>
  );
};

export default SingleLineDiagram;
