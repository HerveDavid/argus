import { useState, useCallback, useMemo, useRef, RefObject } from 'react';
import { ContextMenuState } from '../types/single-line-diagram.type';
import { findParentWithId } from '../utils';

export const useContextMenu = (svgContainerRef: RefObject<HTMLDivElement>) => {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetElement: null,
  });

  // Create a ref to store timing information for manual throttling
  const lastCallTimeRef = useRef<number>(0);
  const throttleDelayMs = 100; // 100ms throttle

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
    },
    [svgContainerRef],
  );

  // Cache the containerRect calculation for performance
  const containerRectRef = useRef<DOMRect | null>(null);
  const getContainerRect = useCallback(() => {
    if (!containerRectRef.current && svgContainerRef.current) {
      containerRectRef.current =
        svgContainerRef.current.getBoundingClientRect();
    }
    return containerRectRef.current;
  }, [svgContainerRef]);

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
      getContainerRect,
    }),
    [contextMenu, handleContextMenu, closeContextMenu, getContainerRect],
  );

  return returnValue;
};
