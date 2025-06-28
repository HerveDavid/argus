import React from 'react';
import { useContextMenu } from '../hooks/use-context-menu';
import ContextMenu from './context-menu'; // Assurez-vous que le chemin d'import est correct

export const DiagramContent: React.FC<{
  svgRef: React.RefObject<SVGSVGElement>;
}> = ({ svgRef }) => {
  const { contextMenu, handleContextMenu, closeContextMenu, setContextMenu } =
    useContextMenu(svgRef);

  // Fonction pour gérer le toggle des disjoncteurs (optionnel - adaptez selon vos besoins)
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

    // Fermer le menu contextuel
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div
      className="h-full flex flex-col relative"
      onClick={(e) => {
        if (contextMenu.visible) {
          const target = e.target as Node;
          const menuElement = document.querySelector('.context-menu');
          const isClickInsideMenu = menuElement && menuElement.contains(target);

          if (!isClickInsideMenu) {
            closeContextMenu();
          }
        }
      }}
    >
      <div className="flex-1 overflow-hidden bg-background border-0 rounded">
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ minHeight: '400px' }}
          onContextMenu={(e) => handleContextMenu(e.nativeEvent)}
        />
      </div>

      {/* Rendu conditionnel du ContextMenu */}
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetElement={contextMenu.targetElement}
          onClose={closeContextMenu}
          onToggleBreaker={toggleBreaker}
        />
      )}
    </div>
  );
};
