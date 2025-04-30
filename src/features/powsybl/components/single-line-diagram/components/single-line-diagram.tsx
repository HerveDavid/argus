import React, { useEffect, useState, useRef } from 'react';
import { useDiagramStore } from '../../../stores/use-diagram.store';
import { SingleLineDiagramProps } from '../types/single-line-diagram.type';
import { useSvgZoomPan } from '../hooks/use-svg-zoom-pan';
import '../styles/diagram-animations.css';

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
  const svgContainerRef = useRef<HTMLDivElement>(null);
  
  // Load SVG content from blob when available
  useEffect(() => {
    const loadSvgContent = async () => {
      if (svgBlob) {
        try {
          const text = await svgBlob.text();
          setSvgContent(text);
        } catch (error) {
          console.error('Error reading SVG blob:', error);
        }
      } else {
        setSvgContent(null);
      }
    };
    
    loadSvgContent();
  }, [svgBlob]);

  // Load diagram when lineId changes
  useEffect(() => {
    if (lineId) {
      loadDiagram(lineId);
    }
    
    // Cleanup on unmount
    return () => {
      // No explicit cleanup needed here as it's handled by the store
    };
  }, [lineId, loadDiagram]);

  // Initialize zoom and pan functionality
  useSvgZoomPan(svgContent, svgContainerRef, {
    minZoom: 0.5,
    maxZoom: 5,
    initialZoom: 1,
    centerOnLoad: true,
  });

  // Handle loading and error states
  if (isLoading) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-gray-600">Loading diagram...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }
  
  if (!svgContent) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-gray-600">No diagram available</div>
      </div>
    );
  }

  return (
    <div
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
        ref={svgContainerRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }} // Prevents browser handling of gestures that conflicts with d3 zoom
      />
    </div>
  );
};

export default SingleLineDiagram;