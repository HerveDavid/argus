import { useEffect, RefObject } from 'react';
import * as d3 from 'd3';

interface ZoomPanOptions {
  minZoom?: number;
  maxZoom?: number;
  initialZoom?: number;
  zoomDuration?: number;
  centerOnLoad?: boolean;
}

/**
 * Custom hook to add zoom and pan functionality to an SVG element
 *
 * @param svgContent The SVG content as a string
 * @param containerRef Reference to the container div
 * @param options Configuration options for zoom and pan behavior
 */
export const useSvgZoomPan = (
  svgContent: string | null,
  containerRef: RefObject<HTMLDivElement>,
  options: ZoomPanOptions = {},
) => {
  const {
    minZoom = 0.5,
    maxZoom = 4,
    initialZoom = 1,
    zoomDuration = 250,
    centerOnLoad = true,
  } = options;

  // Initialize the SVG and zoom behavior when content is available
  useEffect(() => {
    // Don't proceed if svgContent or the container reference is missing
    if (!svgContent || !containerRef.current) return;

    // Get the container element
    const container = containerRef.current;

    // Clear the container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    try {
      // Parse SVG content
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');

      // Check for parsing errors
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        console.error('SVG parsing error:', parserError.textContent);
        return;
      }

      // Get the svg element - check it's actually an SVG
      const svgElement = doc.documentElement;
      if (svgElement.tagName.toLowerCase() !== 'svg') {
        console.error('Root element is not an SVG');
        return;
      }

      // Now we can safely assert this is an SVGSVGElement
      const svgNode = svgElement as unknown as SVGSVGElement;

      // Get original viewBox
      let viewBox = svgNode.getAttribute('viewBox');
      let originalViewBox: [number, number, number, number] | null = null;

      if (viewBox) {
        const viewBoxValues = viewBox.split(/\s+/).map(Number);
        if (viewBoxValues.length === 4) {
          originalViewBox = viewBoxValues as [number, number, number, number];
        }
      }

      if (!originalViewBox) {
        // If no viewBox or invalid format, create one based on width and height
        const width = parseFloat(svgNode.getAttribute('width') || '100');
        const height = parseFloat(svgNode.getAttribute('height') || '100');
        originalViewBox = [0, 0, width, height];
        svgNode.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }

      // Ensure SVG is responsive
      svgNode.setAttribute('width', '100%');
      svgNode.setAttribute('height', '100%');
      svgNode.setAttribute('preserveAspectRatio', 'xMidYMid meet');

      // Add the SVG to the container
      container.appendChild(svgNode);

      // At this point, the SVG is in the DOM, so we can select it with D3
      // Make sure to get the actual DOM element using querySelector
      const svgInDOM = container.querySelector('svg');
      if (!svgInDOM) {
        console.error('SVG not found in DOM after appending');
        return;
      }

      // Create D3 selection with proper type assertion
      const svg = d3.select(svgInDOM as SVGSVGElement);

      // Check if we need to create a container group
      let g = svg.select<SVGGElement>('g.zoom-layer');

      // If the zoom layer doesn't exist, create it
      if (g.empty()) {
        // Add a new group element for zooming
        g = svg.append<SVGGElement>('g').attr('class', 'zoom-layer');

        // Move children into the group
        // Get direct children of SVG (not including g.zoom-layer we just created)
        const gNode = g.node();
        if (gNode) {
          // Get all child nodes that should be moved to the zoom layer
          const childNodes = Array.from(svgInDOM.childNodes);
          for (const child of childNodes) {
            // Skip defs, text nodes, and our zoom layer
            if (
              child.nodeName !== 'defs' &&
              child.nodeName !== '#text' &&
              child !== gNode
            ) {
              // Create a clone of the node (deep clone with all descendants)
              const clone = child.cloneNode(true);

              // Append the clone to the zoom layer group
              gNode.appendChild(clone);

              // Remove the original node
              if (child.parentNode) {
                child.parentNode.removeChild(child);
              }
            }
          }
        }
      }

      // Create zoom behavior
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([minZoom, maxZoom])
        .on('zoom', (event) => {
          g.attr('transform', event.transform.toString());
        });

      // Apply zoom behavior to the SVG
      svg.call(zoom as any);

      // Initialize with center view if requested
      if (centerOnLoad && originalViewBox) {
        const [, , vbWidth, vbHeight] = originalViewBox;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate scale to fit the SVG in the container
        const scaleX = containerWidth / vbWidth;
        const scaleY = containerHeight / vbHeight;
        const scale = Math.min(scaleX, scaleY, initialZoom);

        // Calculate center position
        const centerX = vbWidth / 2;
        const centerY = vbHeight / 2;

        // Set initial transform
        const transform = d3.zoomIdentity
          .translate(containerWidth / 2, containerHeight / 2)
          .scale(scale)
          .translate(-centerX, -centerY);

        svg.call((zoom as any).transform, transform);
      } else {
        // Just apply initial zoom
        svg.call((zoom as any).transform, d3.zoomIdentity.scale(initialZoom));
      }

      // Add handler for window resize
      const handleResize = () => {
        if (!originalViewBox) return;

        const [, , vbWidth, vbHeight] = originalViewBox;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate scale to fit
        const scaleX = containerWidth / vbWidth;
        const scaleY = containerHeight / vbHeight;
        const scale = Math.min(scaleX, scaleY, maxZoom);

        // Calculate center position
        const centerX = vbWidth / 2;
        const centerY = vbHeight / 2;

        // Create the transition
        svg
          .transition()
          .duration(zoomDuration)
          .call(
            (zoom as any).transform,
            d3.zoomIdentity
              .translate(containerWidth / 2, containerHeight / 2)
              .scale(scale)
              .translate(-centerX, -centerY),
          );
      };

      window.addEventListener('resize', handleResize);

      // Return a cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        if (svg.node()) {
          svg.on('.zoom', null);
        }
      };
    } catch (error) {
      console.error('Error setting up SVG zoom/pan:', error);
    }
  }, [
    svgContent,
    containerRef,
    minZoom,
    maxZoom,
    initialZoom,
    centerOnLoad,
    zoomDuration,
  ]);
};
