import React, { useState } from 'react';
import { SVGContextMenu } from './svg-context-menu';

export const DiagramContent: React.FC<{
  svgRef: React.RefObject<SVGSVGElement>;
}> = ({ svgRef }) => {
  const [targetElement, setTargetElement] = useState<SVGElement | null>(null);

  // Fonction pour gérer le toggle des disjoncteurs
  const toggleBreaker = (breakerId: string, isClosed: boolean) => {
    if (!svgRef.current) return;

    // Trouver l'élément du disjoncteur par son ID
    const breakerElement = svgRef.current.querySelector(`#${breakerId}`);
    if (!breakerElement || !(breakerElement instanceof SVGElement)) return;

    if (isClosed) {
      console.log('Open breaker', breakerId);
      // Si fermé → ouvrir
      breakerElement.classList.add('sld-switching');
      breakerElement.classList.remove('sld-closed');
      breakerElement.classList.add('sld-open');
    } else {
      console.log('Close breaker', breakerId);
      // Si ouvert → fermer
      breakerElement.classList.add('sld-switching');
      breakerElement.classList.remove('sld-open');
      breakerElement.classList.add('sld-closed');
    }
  };

  // Gestionnaire pour capturer l'élément ciblé
  const handleContextMenuTrigger = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;

    // Trouve l'élément parent avec un ID si nécessaire
    let element: SVGElement | null = target;
    if (element && !element.id) {
      // Cherche un parent avec un ID (vous pouvez adapter cette logique)
      let parent = element.parentElement;
      while (parent && parent instanceof SVGElement && !parent.id) {
        parent = parent.parentElement;
      }
      if (parent instanceof SVGElement && parent.id) {
        element = parent;
      }
    }

    setTargetElement(element);
  };

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-hidden bg-background border-0 rounded">
        <SVGContextMenu
          targetElement={targetElement}
          onToggleBreaker={toggleBreaker}
        >
          <svg
            ref={svgRef}
            className="w-full h-full cursor-default"
            style={{ minHeight: '400px' }}
            onContextMenu={handleContextMenuTrigger}
          />
        </SVGContextMenu>
      </div>
    </div>
  );
};
