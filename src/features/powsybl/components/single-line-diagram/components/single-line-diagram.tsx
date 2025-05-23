import React, { useEffect, useState, useRef } from 'react';
import { useDiagramStore } from '../../../stores/use-diagram.store';
import ContextMenu from './context-menu';
import LegendOverlay from './legend-overlay';
import { useContextMenu } from '../hooks/use-context-menu';
import { useSvgManipulation } from '../hooks/use-svg-manipulation';
import { useSvgZoomPan } from '../hooks/use-svg-zoom-pan';
import { useDiagramEffects } from '../hooks/use-diagram-effects';
import { SingleLineDiagramProps } from '../types/single-line-diagram.type';

import '../styles/diagram-animations.css';
import { useSvgUpdate } from '../hooks/use-svg-update';
import { feeders_with_dynawo_id } from '../utils/mapping';
import { TeleInformation } from '@/features/powsybl/types/tele-information.type';
import { Effect } from 'effect';
import { sendBreaker } from '@/features/powsybl/services/subscription-ti.service';

const SingleLineDiagram: React.FC<SingleLineDiagramProps> = ({
  lineId,
  width = '100%',
  height = '100%',
  className = '',
}) => {
  const {
    svgBlob,
    isLoading,
    error,
    loadDiagram,
    connectBroker,
    disconnectBroker,
  } = useDiagramStore();

  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isSvgReady, setIsSvgReady] = useState(false);
  const svgContainerRef = useRef<HTMLDivElement>(null);

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

        Effect.runPromise(sendBreaker(breakerId, 1.00));

      } else {
        // Si ouvert → fermer
        breakerElement.classList.remove('sld-open');
        breakerElement.classList.add('sld-closed');

        Effect.runPromise(sendBreaker(breakerId, 0.00));


      }
    }, 600); // Le délai correspond à la durée de l'animation

    // Fermer le menu contextuel
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const { contextMenu, handleContextMenu, closeContextMenu, setContextMenu } =
    useContextMenu(svgContainerRef);

  const { handleUpdateMessage } = useSvgUpdate(svgContent, svgContainerRef);
  useSvgManipulation(svgContent, svgContainerRef);

  useSvgZoomPan(isSvgReady ? svgContent : null, svgContainerRef);

  const { applyBlinkEffect } = useDiagramEffects(
    svgContent,
    svgContainerRef,
    handleContextMenu,
    toggleBreaker,
  );

  useEffect(() => {
    loadDiagram(lineId);
  }, [lineId]);

  useEffect(() => {
    const mapper = (tc: Record<string, number>) => {
      console.log(tc);
      for (const [id, value] of Object.entries(tc)) {
        const tm: TeleInformation = {
          ti: 'TM',
          data: { id, value },
        };

        handleUpdateMessage(tm);
        // const id_finded = feeders_with_dynawo_id.find((val) =>
        //   id.includes(val.dynawo_id),
        // );

        // if (id_finded) {
        //   const tm: TeleInformation = {
        //     ti: 'TM',
        //     data: { id: id_finded.id, value },
        //   };
        //   console.log('TM: ', tm);
        //   handleUpdateMessage(tm);
        // } else {
        //   console.log('NO TM');
        // }
      }
    };

    connectBroker(lineId, mapper);

    return () => {
      disconnectBroker(lineId);
    };
  }, [[lineId]]);

  useEffect(() => {
    if (svgBlob) {
      svgBlob.text().then((text) => {
        setSvgContent(text);
      });
    } else {
      setSvgContent(null);
    }
  }, [svgBlob]);

  useEffect(() => {
    if (svgContent && svgContainerRef.current) {
      requestAnimationFrame(() => {
        const svg = svgContainerRef.current?.querySelector('svg');
        if (svg) {
          setIsSvgReady(true);
        }
      });
    } else {
      setIsSvgReady(false);
    }
  }, [svgContent]);

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
        onClick={(e) => {
          if (contextMenu.visible) {
            const target = e.target as Node;
            const menuElement = document.querySelector('.context-menu');
            const isClickInsideMenu =
              menuElement && menuElement.contains(target);

            if (!isClickInsideMenu) {
              closeContextMenu();
            }
          }
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
