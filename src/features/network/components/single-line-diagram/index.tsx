import { useEffect, useState, useRef } from 'react';
import { useDiagramStore } from '../../stores/use-diagram.store';
import * as d3 from 'd3';

interface SingleLineDiagramProps {
  lineId: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}

const SingleLineDiagram: React.FC<SingleLineDiagramProps> = ({
  lineId,
  width = '100%',
  height = 'auto',
  className = '',
}: SingleLineDiagramProps) => {
  const { svgBlob, isLoading, error, loadDiagram, resetDiagram } =
    useDiagramStore();
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDiagram(lineId);
    return () => {
      resetDiagram();
    };
  }, [lineId, loadDiagram, resetDiagram]);

  useEffect(() => {
    if (svgBlob) {
      svgBlob.text().then((text) => {
        setSvgContent(text);
      });
    } else {
      setSvgContent(null);
    }
  }, [svgBlob]);

  // Simple effect to make the SVG fit perfectly within the card container
  useEffect(() => {
    if (svgContent && svgContainerRef.current) {
      const svgElement = svgContainerRef.current.querySelector('svg');

      if (svgElement) {
        // Ensure that the SVG fits perfectly within the card container
        d3.select(svgElement)
          .attr('width', '100%')
          .attr('height', '100%')
          .attr('preserveAspectRatio', 'xMidYMid meet')
          .style('max-width', '100%')
          .style('max-height', '100%')
          .style('overflow', 'hidden');

        // Find the existing viewBox or create one if necessary
        const viewBox = svgElement.getAttribute('viewBox');
        if (!viewBox) {
          const bbox = (svgElement as SVGSVGElement).getBBox();
          // Add some padding to ensure content is visible
          const padding = 5;
          svgElement.setAttribute(
            'viewBox',
            `${bbox.x - padding} ${bbox.y - padding} ${
              bbox.width + padding * 2
            } ${bbox.height + padding * 2}`,
          );
        }

        // Make sure the SVG scales to fit the container perfectly
        const containerWidth = svgContainerRef.current.clientWidth;
        const containerHeight = svgContainerRef.current.clientHeight;

        if (containerWidth && containerHeight) {
          // Set viewBox to maintain aspect ratio while fitting perfectly
          const currentViewBox = svgElement
            .getAttribute('viewBox')
            ?.split(' ')
            .map(Number) || [0, 0, 100, 100];
          const viewBoxWidth = currentViewBox[2];
          const viewBoxHeight = currentViewBox[3];

          const svgAspectRatio = viewBoxWidth / viewBoxHeight;
          const containerAspectRatio = containerWidth / containerHeight;

          if (containerAspectRatio > svgAspectRatio) {
            // Container is wider than SVG
            const newWidth = viewBoxHeight * containerAspectRatio;
            const xOffset = (newWidth - viewBoxWidth) / 2;
            svgElement.setAttribute(
              'viewBox',
              `${currentViewBox[0] - xOffset} ${
                currentViewBox[1]
              } ${newWidth} ${viewBoxHeight}`,
            );
          } else {
            // Container is taller than SVG
            const newHeight = viewBoxWidth / containerAspectRatio;
            const yOffset = (newHeight - viewBoxHeight) / 2;
            svgElement.setAttribute(
              'viewBox',
              `${currentViewBox[0]} ${
                currentViewBox[1] - yOffset
              } ${viewBoxWidth} ${newHeight}`,
            );
          }
        }
      }
    }
  }, [svgContent]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        Loading diagram...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (svgContent) {
    return (
      <div
        ref={svgContainerRef}
        className={`relative ${className}`}
        style={{
          width,
          height,
          overflow: 'hidden', // Prevents overflow
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center h-40 text-gray-500">
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
