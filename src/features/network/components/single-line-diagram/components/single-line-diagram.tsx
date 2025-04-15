import React, { useEffect, useState, useRef } from 'react';
import { useDiagramStore } from '../../../stores/use-diagram.store';
import ContextMenu from './context-menu';
import LegendOverlay from './legend-overlay';
import { useContextMenu } from '../hooks/use-context-menu';
import { useSvgManipulation } from '../hooks/use-svg-manipulation';
import { useDiagramEffects } from '../hooks/use-diagram-effects';
import { SingleLineDiagramProps } from '../types/single-line-diagram.type';

// Import uniquement des styles d'animation
import '../styles/diagram-animations.css';
import { useSvgUpdate } from '../hooks/use-svg-update';

const SingleLineDiagram: React.FC<SingleLineDiagramProps> = ({
  lineId,
  width = '100%',
  height = 'auto',
  className = '',
}) => {
  const {
    svgBlob,
    isLoading,
    error,
    loadDiagram,
    subscribeDiagram,
    unsubscribeDiagram,
  } = useDiagramStore();

  const [svgContent, setSvgContent] = useState<string | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Fonction pour basculer l'état d'un disjoncteur avec effet de clignotement
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

  // Utiliser les hooks personnalisés
  const { contextMenu, handleContextMenu, closeContextMenu, setContextMenu } =
    useContextMenu(svgContainerRef);

  useSvgManipulation(svgContent, svgContainerRef);
  const { handleUpdateMessage } = useSvgUpdate(svgContent, svgContainerRef);

  const { applyBlinkEffect } = useDiagramEffects(
    svgContent,
    svgContainerRef,
    handleContextMenu,
    toggleBreaker,
  );

  // Charger le diagramme lors du montage et quand lineId change
  useEffect(() => {
    const subscribe = async () => {
      await loadDiagram(lineId);
      await subscribeDiagram(handleUpdateMessage);
    };

    subscribe();

    return () => {
      const cleanUp = async () => {
        await unsubscribeDiagram();
      };
      cleanUp();
    };
  }, [lineId, loadDiagram]);

  useEffect(() => {
    if (svgBlob) {
      svgBlob.text().then((text) => {
        setSvgContent(text);
      });
    } else {
      setSvgContent(null);
    }
  }, [svgBlob]);

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

        <LegendOverlay />
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
