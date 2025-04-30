import { useEffect, RefObject } from 'react';
import { SVG, Svg } from '@svgdotjs/svg.js';

interface ZoomPanOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomFactor?: number;
  panEnabled?: boolean;
  zoomEnabled?: boolean;
  wheelZoomEnabled?: boolean;
  initialZoom?: number;
  animationDuration?: number;
  onZoom?: (zoomLevel: number) => void;
  onPan?: (x: number, y: number) => void;
}

export const useSvgZoomPan = (
  containerRef: RefObject<HTMLDivElement>,
  options: ZoomPanOptions = {},
) => {
  const {
    minZoom = 0.5,
    maxZoom = 3,
    zoomFactor = 0.1,
    panEnabled = true,
    zoomEnabled = true,
    wheelZoomEnabled = true,
    initialZoom = 1,
    animationDuration = 300,
    onZoom,
    onPan,
  } = options;

  useEffect(() => {
    if (!containerRef.current) return;

    let svgInstance: Svg | null = null;
    let isPanning = false;
    let startPoint = { x: 0, y: 0 };
    let viewBox = { x: 0, y: 0, width: 0, height: 0 };
    let originalViewBox = { x: 0, y: 0, width: 0, height: 0 };
    let currentZoom = initialZoom;

    const initSvg = (svgElement: SVGSVGElement) => {
      if (!svgElement) return null;

      svgInstance = SVG(svgElement);

      const vb = svgElement.viewBox.baseVal;
      if (vb.width && vb.height) {
        viewBox = { x: vb.x, y: vb.y, width: vb.width, height: vb.height };
        originalViewBox = { ...viewBox };
      } else {
        const width = svgElement.width.baseVal.value || svgElement.clientWidth;
        const height =
          svgElement.height.baseVal.value || svgElement.clientHeight;
        viewBox = { x: 0, y: 0, width, height };
        originalViewBox = { ...viewBox };
        svgInstance.viewbox(0, 0, width, height);
      }

      if (initialZoom !== 1) {
        applyZoom(initialZoom);
      }

      return svgInstance;
    };

    const applyZoom = (zoom: number, centerX?: number, centerY?: number) => {
      if (!svgInstance) return;

      const newZoom = Math.min(Math.max(zoom, minZoom), maxZoom);

      if (newZoom === currentZoom) return;

      const svgElement = svgInstance.node;
      const svgRect = svgElement.getBoundingClientRect();

      const cx = centerX !== undefined ? centerX : svgRect.width / 2;
      const cy = centerY !== undefined ? centerY : svgRect.height / 2;

      const pt = svgElement.createSVGPoint();
      pt.x = cx;
      pt.y = cy;
      const svgP = pt.matrixTransform(svgElement.getScreenCTM()?.inverse());

      const zoomRatio = currentZoom / newZoom;
      const newWidth = viewBox.width * zoomRatio;
      const newHeight = viewBox.height * zoomRatio;

      const newX = svgP.x - (svgP.x - viewBox.x) * zoomRatio;
      const newY = svgP.y - (svgP.y - viewBox.y) * zoomRatio;

      svgInstance.viewbox(newX, newY, newWidth, newHeight);

      viewBox = { x: newX, y: newY, width: newWidth, height: newHeight };
      currentZoom = newZoom;

      if (onZoom) onZoom(currentZoom);
    };

    const animateViewbox = (
      startViewbox: { x: number; y: number; width: number; height: number },
      targetViewbox: { x: number; y: number; width: number; height: number },
      duration: number,
    ) => {
      if (!svgInstance) return;

      const startTime = performance.now();
      const endTime = startTime + duration;

      const animate = (currentTime: number) => {
        if (currentTime >= endTime) {
          svgInstance?.viewbox(
            targetViewbox.x,
            targetViewbox.y,
            targetViewbox.width,
            targetViewbox.height,
          );
          currentZoom = originalViewBox.width / targetViewbox.width;
          viewBox = { ...targetViewbox };
          if (onZoom) onZoom(currentZoom);
          return;
        }

        const progress = (currentTime - startTime) / duration;
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out

        const currentX =
          startViewbox.x + (targetViewbox.x - startViewbox.x) * easedProgress;
        const currentY =
          startViewbox.y + (targetViewbox.y - startViewbox.y) * easedProgress;
        const currentWidth =
          startViewbox.width +
          (targetViewbox.width - startViewbox.width) * easedProgress;
        const currentHeight =
          startViewbox.height +
          (targetViewbox.height - startViewbox.height) * easedProgress;

        svgInstance?.viewbox(currentX, currentY, currentWidth, currentHeight);

        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    };

    const animatedResetZoom = () => {
      if (!svgInstance) return;

      animateViewbox(viewBox, originalViewBox, animationDuration);
    };

    const handleWheel = (e: WheelEvent) => {
      if (!wheelZoomEnabled || !zoomEnabled || !svgInstance) return;

      e.preventDefault();

      const delta = e.deltaY < 0 ? 1 : -1;
      const zoomDelta = delta * zoomFactor;
      const newZoom = currentZoom * (1 + zoomDelta);

      applyZoom(newZoom, e.clientX, e.clientY);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!panEnabled || !svgInstance || e.button !== 0) return;

      e.preventDefault();

      isPanning = true;
      startPoint = { x: e.clientX, y: e.clientY };

      if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning || !svgInstance) return;

      e.preventDefault();

      const dx = e.clientX - startPoint.x;
      const dy = e.clientY - startPoint.y;

      const svgElement = svgInstance.node;
      const scale = viewBox.width / svgElement.clientWidth;

      const newX = viewBox.x - dx * scale;
      const newY = viewBox.y - dy * scale;

      svgInstance.viewbox(newX, newY, viewBox.width, viewBox.height);

      viewBox.x = newX;
      viewBox.y = newY;
      startPoint = { x: e.clientX, y: e.clientY };

      if (onPan) onPan(newX, newY);
    };

    const handleMouseUp = () => {
      isPanning = false;

      if (containerRef.current) {
        containerRef.current.style.cursor = 'grab';
      }
    };

    const handleDoubleClick = (e: MouseEvent) => {
      if (!zoomEnabled || !svgInstance) return;

      e.preventDefault();
      animatedResetZoom();
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const svgElement = containerRef.current?.querySelector('svg');
          if (svgElement && !svgInstance) {
            svgInstance = initSvg(svgElement);

            if (wheelZoomEnabled) {
              containerRef.current?.addEventListener('wheel', handleWheel, {
                passive: false,
              });
            }

            if (panEnabled) {
              containerRef.current?.addEventListener(
                'mousedown',
                handleMouseDown,
              );
              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);

              if (containerRef.current) {
                containerRef.current.style.cursor = 'grab';
              }
            }

            if (zoomEnabled) {
              containerRef.current?.addEventListener(
                'dblclick',
                handleDoubleClick,
              );
            }
          }
        }
      });
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });

      const svgElement = containerRef.current.querySelector('svg');
      if (svgElement) {
        svgInstance = initSvg(svgElement);

        if (wheelZoomEnabled) {
          containerRef.current.addEventListener('wheel', handleWheel, {
            passive: false,
          });
        }

        if (panEnabled) {
          containerRef.current.addEventListener('mousedown', handleMouseDown);
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);

          containerRef.current.style.cursor = 'grab';
        }

        if (zoomEnabled) {
          containerRef.current.addEventListener('dblclick', handleDoubleClick);
        }
      }
    }

    return () => {
      observer.disconnect();

      if (containerRef.current) {
        containerRef.current.removeEventListener('wheel', handleWheel);
        containerRef.current.removeEventListener('mousedown', handleMouseDown);
        containerRef.current.removeEventListener('dblclick', handleDoubleClick);
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef, options]);

  return {
    zoomIn: () => {
      const svgElement = containerRef.current?.querySelector('svg');
      if (svgElement) {
        const svg = SVG(svgElement);
        const vb = svg.viewbox();

        const zoomFactor = options.zoomFactor || 0.1;
        const newZoomFactor = 1 + zoomFactor;

        const newWidth = vb.width / newZoomFactor;
        const newHeight = vb.height / newZoomFactor;

        const newX = vb.x + (vb.width - newWidth) / 2;
        const newY = vb.y + (vb.height - newHeight) / 2;

        svg.viewbox(newX, newY, newWidth, newHeight);

        const svgNative = svgElement as SVGSVGElement;
        const origWidth = svgNative.viewBox.baseVal.width;
        const currentZoom = origWidth / newWidth;

        if (options.onZoom) options.onZoom(currentZoom);
      }
    },
    zoomOut: () => {
      const svgElement = containerRef.current?.querySelector('svg');
      if (svgElement) {
        const svg = SVG(svgElement);
        const vb = svg.viewbox();

        const zoomFactor = options.zoomFactor || 0.1;
        const newZoomFactor = 1 - zoomFactor;

        const newWidth = vb.width / newZoomFactor;
        const newHeight = vb.height / newZoomFactor;

        const newX = vb.x + (vb.width - newWidth) / 2;
        const newY = vb.y + (vb.height - newHeight) / 2;

        svg.viewbox(newX, newY, newWidth, newHeight);

        const svgNative = svgElement as SVGSVGElement;
        const origWidth = svgNative.viewBox.baseVal.width;
        const currentZoom = origWidth / newWidth;

        if (options.onZoom) options.onZoom(currentZoom);
      }
    },
    resetZoom: () => {
      const svgElement = containerRef.current?.querySelector('svg');
      if (svgElement) {
        const svg = SVG(svgElement);
        const svgNative = svgElement as SVGSVGElement;
        const currentVb = svg.viewbox();

        const targetVb = svgNative.viewBox.baseVal
          ? {
              x: svgNative.viewBox.baseVal.x,
              y: svgNative.viewBox.baseVal.y,
              width: svgNative.viewBox.baseVal.width,
              height: svgNative.viewBox.baseVal.height,
            }
          : {
              x: 0,
              y: 0,
              width: svgNative.width.baseVal.value,
              height: svgNative.height.baseVal.value,
            };

        const animationDuration = options.animationDuration || 300;

        const startTime = performance.now();
        const endTime = startTime + animationDuration;

        const animate = (currentTime: number) => {
          if (currentTime >= endTime) {
            svg.viewbox(
              targetVb.x,
              targetVb.y,
              targetVb.width,
              targetVb.height,
            );
            if (options.onZoom) options.onZoom(1);
            return;
          }

          const progress = (currentTime - startTime) / animationDuration;
          const easedProgress = 1 - Math.pow(1 - progress, 3);

          const currentX =
            currentVb.x + (targetVb.x - currentVb.x) * easedProgress;
          const currentY =
            currentVb.y + (targetVb.y - currentVb.y) * easedProgress;
          const currentWidth =
            currentVb.width +
            (targetVb.width - currentVb.width) * easedProgress;
          const currentHeight =
            currentVb.height +
            (targetVb.height - currentVb.height) * easedProgress;

          svg.viewbox(currentX, currentY, currentWidth, currentHeight);

          requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
      }
    },
    fitContent: () => {
      const svgElement = containerRef.current?.querySelector('svg');
      if (svgElement) {
        const svg = SVG(svgElement);
        const currentVb = svg.viewbox();
        const bbox = svg.bbox();

        const margin = 20;
        const targetVb = {
          x: bbox.x - margin,
          y: bbox.y - margin,
          width: bbox.width + 2 * margin,
          height: bbox.height + 2 * margin,
        };

        const animationDuration = options.animationDuration || 300;

        const startTime = performance.now();
        const endTime = startTime + animationDuration;

        const animate = (currentTime: number) => {
          if (currentTime >= endTime) {
            svg.viewbox(
              targetVb.x,
              targetVb.y,
              targetVb.width,
              targetVb.height,
            );
            return;
          }

          const progress = (currentTime - startTime) / animationDuration;
          const easedProgress = 1 - Math.pow(1 - progress, 3);

          const currentX =
            currentVb.x + (targetVb.x - currentVb.x) * easedProgress;
          const currentY =
            currentVb.y + (targetVb.y - currentVb.y) * easedProgress;
          const currentWidth =
            currentVb.width +
            (targetVb.width - currentVb.width) * easedProgress;
          const currentHeight =
            currentVb.height +
            (targetVb.height - currentVb.height) * easedProgress;

          svg.viewbox(currentX, currentY, currentWidth, currentHeight);

          requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
      }
    },
  };
};
