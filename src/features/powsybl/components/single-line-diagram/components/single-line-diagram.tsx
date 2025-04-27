import React, { useEffect, useState, useRef } from 'react';
import { useDiagramStore } from '../../../stores/use-diagram.store';
import ContextMenu from './context-menu';
import LegendOverlay from './legend-overlay';
import { useContextMenu } from '../hooks/use-context-menu';
import { useSvgManipulation } from '../hooks/use-svg-manipulation';
import { useSvgZoomPan } from '../hooks/use-svg-zoom-pan';
import { useDiagramEffects } from '../hooks/use-diagram-effects';
import { SingleLineDiagramProps } from '../types/single-line-diagram.type';

// Import uniquement des styles d'animation
import '../styles/diagram-animations.css';
import { useSvgUpdate } from '../hooks/use-svg-update';
import { TelemetryCurves } from '@/features/powsybl/types/telemetry-curves.type';
import { feeders_with_dynawo_id } from '../utils/mapping';
import { TeleInformation } from '@/features/powsybl/types/tele-information.type';

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
    subscribeDiagram,
    unsubscribeDiagram,
  } = useDiagramStore();

  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isSvgReady, setIsSvgReady] = useState(false);
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

  const { handleUpdateMessage } = useSvgUpdate(svgContent, svgContainerRef);
  useSvgManipulation(svgContent, svgContainerRef);

  // N'utiliser le hook de zoom que lorsque le SVG est prêt
  useSvgZoomPan(isSvgReady ? svgContent : null, svgContainerRef);

  const { applyBlinkEffect } = useDiagramEffects(
    svgContent,
    svgContainerRef,
    handleContextMenu,
    toggleBreaker,
  );

  // Charger le diagramme lors du montage et quand lineId change
  useEffect(() => {
    const mapper = (tc: TelemetryCurves) => {
      for (const dynawoId in tc.curves.values) {
        const id = feeders_with_dynawo_id.find((value) =>
          dynawoId.includes(value.dynawo_id),
        );

        if (id?.id) {
          const tm: TeleInformation = {
            ti: 'TM',
            data: { id: id.id, value: tc.curves.values[dynawoId] },
          };
          console.log('TM: ', tm);
          handleUpdateMessage(tm);
        } else {
          console.log('NO TM');
        }
      }
    };

    const subscribe = async () => {
      await loadDiagram(lineId);
      subscribeDiagram(mapper);
    };

    subscribe();

    return () => {
      unsubscribeDiagram();
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

  // Vérifier que le SVG est bien chargé dans le DOM
  useEffect(() => {
    if (svgContent && svgContainerRef.current) {
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est mis à jour
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
