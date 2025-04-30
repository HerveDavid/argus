import React, { useEffect, useState, useRef } from 'react';
import { useDiagramStore } from '../../../stores/use-diagram.store';
import { SingleLineDiagramProps } from '../types/single-line-diagram.type';
import { useSvgZoomPan } from '../hooks/use-svg-zoom-pan';
import { SVG, Svg } from '@svgdotjs/svg.js';
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
  const [, setSvgInstance] = useState<Svg | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const {} = useSvgZoomPan(svgContainerRef, {
    minZoom: 0.5,
    maxZoom: 5,
    zoomFactor: 0.2,
    wheelZoomEnabled: true,
    panEnabled: true,
    initialZoom: 1,
    onZoom: (zoomLevel) => {
      console.log(`Zoom level: ${zoomLevel}`);
    },
    onPan: (x, y) => {
      console.log(`Pan position: ${x}, ${y}`);
    },
  });
  const { handleUpdateMessage } = useSvgUpdate(svgContent, svgContainerRef);

  useEffect(() => {
    if (lineId) {
      loadDiagram(lineId);
    }
  }, [lineId, loadDiagram]);

  useEffect(() => {
    if (svgBlob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setSvgContent(content);
      };
      reader.readAsText(svgBlob);
    }
  }, [svgBlob]);

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
    if (svgContent && svgContainerRef.current) {
      setTimeout(() => {
        const svgElement = svgContainerRef.current?.querySelector('svg');
        if (svgElement) {
          const instance = SVG(svgElement);
          instance.size('100%', '100%');
          setSvgInstance(instance);

          instance.find('.node').forEach((node) => {
            node.addClass('diagram-node');
          });
          instance.find('.connection').forEach((connection) => {
            connection.addClass('diagram-connection');
          });
        }
      }, 100);
    }
  }, [svgContent]);

  const createSvgContent = () => {
    if (svgContent) {
      return { __html: svgContent };
    }
    return { __html: '' };
  };

  return (
    <div className={`diagram-container ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="diagram-loading">
          <span>Loading diagram...</span>
        </div>
      )}
      {error && (
        <div className="diagram-error">
          <span>Error loading diagram: {error}</span>
        </div>
      )}
      {!isLoading && !error && (
        <>
          <div
            ref={svgContainerRef}
            className="diagram-svg-container"
            style={{ width: '100%', height: '100%', overflow: 'hidden' }}
            dangerouslySetInnerHTML={createSvgContent()}
          />
        </>
      )}
    </div>
  );
};

export default SingleLineDiagram;
