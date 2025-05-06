import React, { useEffect, useState, useRef } from 'react';
import { useDiagramStore } from '../../../stores/use-diagram.store';
import { SingleLineDiagramProps } from '../types/single-line-diagram.type';
import { useSvgZoomPan } from '../hooks/use-svg-zoom-pan';
import { SVG, Svg } from '@svgdotjs/svg.js';
import '../styles/diagram-animations.css';

import ContextMenu from '../components/context-menu';

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
  });

  // Add state for context menu
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

  // Create a ref to store timing information for manual throttling
  const lastCallTimeRef = useRef<number>(0);
  const throttleDelayMs = 100; // 100ms throttle

  // Function to find parent with ID (utility function)
  const findParentWithId = (
    element: Element | null,
    maxDepth: number = 5,
  ): Element | null => {
    if (!element) return null;
    if (element.id) return element;
    if (maxDepth <= 0) return null;
    return findParentWithId(element.parentElement, maxDepth - 1);
  };

  // Context menu handler
  const handleContextMenu = (
    e: Event,
    isLabelClick = false,
    labelElement: SVGElement | null = null,
  ) => {
    e.preventDefault();

    // Manual throttling implementation
    const now = Date.now();
    if (now - lastCallTimeRef.current < throttleDelayMs) {
      return;
    }
    lastCallTimeRef.current = now;

    const mouseEvent = e as MouseEvent;

    // Get coordinates relative to the SVG container
    const containerRect = svgContainerRef.current?.getBoundingClientRect();
    if (containerRect) {
      // Calculate coordinates relative to the container
      const relativeX = mouseEvent.clientX - containerRect.left;
      const relativeY = mouseEvent.clientY - containerRect.top;

      // If it's a click on a label, use the label as target
      // otherwise use the element targeted by the event
      const targetElement = isLabelClick
        ? labelElement
        : (e.target as SVGElement | null);

      let element: SVGElement | null = targetElement;
      if (!isLabelClick && element) {
        const foundParent = findParentWithId(element);
        // Type cast the result to SVGElement if it exists
        element = foundParent as SVGElement | null;
      }

      setContextMenu({
        visible: true,
        x: relativeX,
        y: relativeY,
        targetElement: element || targetElement,
      });
    }
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    if (lineId) {
      loadDiagram(lineId);
      subscribeDiagram(console.log);
    }

    return () => {
      unsubscribeDiagram();
    };
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
    if (svgContent && svgContainerRef.current) {
      setTimeout(() => {
        const svgElement = svgContainerRef.current?.querySelector('svg');
        if (svgElement) {
          const instance = SVG(svgElement);
          instance.size('100%', '100%');
          setSvgInstance(instance);

          // Add context menu event listeners
          svgElement.addEventListener('contextmenu', handleContextMenu);

          // Set up nodes and connections classes
          instance.find('.node').forEach((node) => {
            node.addClass('diagram-node');
          });
          instance.find('.connection').forEach((connection) => {
            connection.addClass('diagram-connection');
          });
        }
      }, 100);
    }

    // Cleanup event listeners
    return () => {
      if (svgContainerRef.current) {
        const svgElement = svgContainerRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.removeEventListener('contextmenu', handleContextMenu);
        }
      }
    };
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

          {/* Render the context menu when visible */}
          {contextMenu.visible && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              targetElement={contextMenu.targetElement}
              onClose={closeContextMenu}
              onToggleBreaker={() => console.log('toggle breaker')}
            />
          )}
        </>
      )}
    </div>
  );
};

export default SingleLineDiagram;
