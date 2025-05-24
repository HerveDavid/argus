import { useEffect, RefObject } from 'react';
import { findParentWithId } from '../utils';

export const useDiagramEffects = (
  svgContent: string | null,
  svgContainerRef: RefObject<HTMLDivElement>,
  handleContextMenu: (
    e: Event,
    isLabelClick?: boolean,
    labelElement?: SVGElement | null,
    labelText?: string,
  ) => void,
  toggleBreaker: (breakerId: string, isClosed: boolean) => void,
) => {
  // Fonction pour appliquer l'effet de clignotement
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

  useEffect(() => {
    const listeners: Array<{
      element: Element;
      type: string;
      handler: EventListenerOrEventListenerObject;
      }> = [];

    if (svgContent && svgContainerRef.current) {
      // Ajouter les écouteurs d'événements pour le menu contextuel et les effets de survol
      const addEventListeners = () => {
        if (svgContainerRef.current) {
          // Ajouter le menu contextuel à tous les éléments SVG
          const svgElements =
            svgContainerRef.current.querySelectorAll('svg, svg *');

          svgElements.forEach((element) => {
            const handler = handleContextMenu as EventListener;
            element.addEventListener('contextmenu', handler);
            listeners.push({ element, type: 'contextmenu', handler})
          });

          // Ajouter l'effet de survol aux éléments sld-label
          const labelElements =
            svgContainerRef.current.querySelectorAll('.sld-label');
          labelElements.forEach((label) => {
            // Sauvegarder le style original
            const originalFill = label.getAttribute('fill') || 'black';
            const originalFont = label.getAttribute('font') || '';

            // Ajouter les effets de survol
            const mouseEnter = () =>  {
              label.setAttribute('fill', '#FF5500');
              label.setAttribute('font-weight', 'bold');
              if (label instanceof SVGElement || label instanceof HTMLElement) {
                label.style.cursor = 'pointer';
              }
            };

            const mouseLeave = () => {
              label.setAttribute('fill', originalFill);
              label.setAttribute('font-weight', 'normal');
              if (originalFont) {
                label.setAttribute('font', originalFont);
              }
            };

            // Ajouter l'événement de clic pour les étiquettes
            const click = (e: Event) => {
              e.preventDefault();
              e.stopPropagation();

              // Obtenir le texte de l'étiquette
              const labelText: string = label.textContent || '';

              // Afficher une infobulle ou effectuer une action lors du clic sur l'étiquette
              handleContextMenu(e, true, label as SVGElement, labelText);
            };

          label.addEventListener('mouseenter', mouseEnter);
          label.addEventListener('mouseleave', mouseLeave);
          label.addEventListener('click', click);

          listeners.push(
            { element: label, type: 'mouseenter', handler: mouseEnter },
            { element: label, type: 'mouseleave', handler: mouseLeave },
            { element: label, type: 'click', handler: click }
          );
          });

        // Ajouter l'effet de survol et la gestion des clics aux disjoncteurs et sectionneurs
        const switchableElements = svgContainerRef.current.querySelectorAll(
          '.sld-breaker, .sld-disconnector',
        );

        switchableElements.forEach((element) => {

          const mouseEnter = () => {
            if (
              element instanceof SVGElement ||
              element instanceof HTMLElement
            ) {
              element.style.cursor = 'pointer';
              element.style.filter = 'brightness(1.2)';
            }
          };

          const mouseLeave = () => {
            if (
              element instanceof SVGElement ||
              element instanceof HTMLElement
            ) {
              // Ne pas réinitialiser le filtre si l'animation est en cours
              if (!element.classList.contains('sld-switching')) {
                element.style.filter = 'none';
              }
            }
          };

          // Ajouter l'événement de clic pour basculer directement
          const click = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();

            // Trouver le parent qui contient l'ID
            const switchGroup = findParentWithId(element as Element);

            if (switchGroup && switchGroup.id) {
              const isClosed = switchGroup.classList.contains('sld-closed');
              toggleBreaker(switchGroup.id, isClosed);
            }
          };

          element.addEventListener('mouseenter', mouseEnter);
          element.addEventListener('mouseleave', mouseLeave);
          element.addEventListener('click', click);

          listeners.push(
            { element, type: 'mouseenter', handler: mouseEnter },
            { element, type: 'mouseleave', handler: mouseLeave },
            { element, type: 'click', handler: click }
          );
        });
        }
      };
      // Ajouter tous les écouteurs d'événements
      addEventListeners();

      // Fonction de nettoyage
      return () => {
        listeners.forEach(({ element, type, handler }) => {
        element.removeEventListener(type, handler);
        });
      };
    }
  }, [svgContent, handleContextMenu, toggleBreaker]);

  return { applyBlinkEffect };
};
