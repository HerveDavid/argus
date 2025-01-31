import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import * as d3 from 'd3';

const SVGViewer: React.FC = () => {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>('');

  const loadSVG = async (file: File) => {
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(text, 'image/svg+xml');
      
      if (svgDoc.querySelector('parsererror')) {
        throw new Error('Invalid SVG format');
      }

      const container = d3.select(svgContainerRef.current);
      container.selectAll('*').remove();
      
      const originalSvg = svgDoc.documentElement;
      const contentDiv = container
        .append('div')
        .style('width', '100%')
        .style('height', '100%')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('align-items', 'center');
      
      const newSvg = contentDiv
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', originalSvg.getAttribute('viewBox') || null)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      // Copie des définitions et styles
      const defs = originalSvg.querySelector('defs');
      if (defs) {
        const newDefs = newSvg.append('defs');
        Array.from(defs.children).forEach(child => {
          newDefs.node()?.appendChild(child.cloneNode(true));
        });
      }

      const styles = originalSvg.querySelectorAll('style');
      styles.forEach(style => {
        newSvg.append('style').text(style.textContent || '');
      });

      // Groupe principal pour le zoom
      const mainGroup = newSvg.append('g');

      // Copie des éléments
      Array.from(originalSvg.children).forEach(child => {
        if (child.tagName !== 'defs' && child.tagName !== 'style') {
          mainGroup.node()?.appendChild(child.cloneNode(true));
        }
      });

      // Configuration du zoom
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
          mainGroup.attr('transform', event.transform.toString());
        });

      newSvg
        .call(zoom)
        .on('dblclick.zoom', null)
        .on('dblclick', () => {
          newSvg
            .transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity);
        });

      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading SVG');
      console.error(err);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === 'image/svg+xml') {
      loadSVG(file);
    } else {
      setError('Please drop a valid SVG file');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div 
        className="p-2 text-center h-[600px] transition-colors hover:border-gray-400"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        ref={svgContainerRef}
      >
        {error && (
          <div className="text-red-500 mb-4">{error}</div>
        )}
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="text-gray-600 mt-4">Glissez et déposez votre fichier SVG ici</p>
        <p className="text-sm text-gray-500">Format accepté : .svg</p>
      </div>
    </div>
  );
};

export default SVGViewer;