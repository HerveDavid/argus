import { useState, useCallback, useMemo, useRef, RefObject } from 'react';
import { findParentWithId } from '../utils';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetElement: SVGElement | null;
}


export const useContextMenu = (svgRef: RefObject<SVGSVGElement>) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetElement: null,
  });

  const lastCallTimeRef = useRef<number>(0);
  const throttleDelayMs = 100;

  const handleContextMenu = useCallback(
    (
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

      // Get coordinates relative to the SVG element
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (svgRect) {
        // Calculate coordinates relative to the SVG
        const relativeX = mouseEvent.clientX - svgRect.left;
        const relativeY = mouseEvent.clientY - svgRect.top;

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
    },
    [svgRef],
  );

  // Cache the svgRect calculation for performance
  const svgRectRef = useRef<DOMRect | null>(null);
  const getSvgRect = useCallback(() => {
    if (!svgRectRef.current && svgRef.current) {
      svgRectRef.current = svgRef.current.getBoundingClientRect();
    }
    return svgRectRef.current;
  }, [svgRef]);

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  // Memoize return value to prevent unnecessary re-renders
  const returnValue = useMemo(
    () => ({
      contextMenu,
      setContextMenu,
      handleContextMenu,
      closeContextMenu,
      getSvgRect,
    }),
    [contextMenu, handleContextMenu, closeContextMenu, getSvgRect],
  );

  return returnValue;
};
