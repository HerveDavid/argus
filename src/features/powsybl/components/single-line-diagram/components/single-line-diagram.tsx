import React, { useEffect, useState, useRef } from 'react';
import { useDiagramStore } from '../../../stores/use-diagram.store';
import { SingleLineDiagramProps } from '../types/single-line-diagram.type';
import { useSvgZoomPan } from '../hooks/use-svg-zoom-pan';
import { SVG, Svg } from '@svgdotjs/svg.js';
// import '@svgdotjs/svg.js/dist/svg.min.css'; // Assurez-vous d'importer les styles si nécessaire
import '../styles/diagram-animations.css';

const SingleLineDiagram: React.FC<SingleLineDiagramProps> = ({
  lineId,
  width = '100%',
  height = '100%',
  className = '',
}) => {
  const { svgBlob, isLoading, error, loadDiagram } = useDiagramStore();
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [svgInstance, setSvgInstance] = useState<Svg | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Utiliser notre hook personnalisé pour le zoom et le panoramique
  const { zoomIn, zoomOut, resetZoom, fitContent } = useSvgZoomPan(
    svgContainerRef,
    {
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
    },
  );

  // Charger le diagramme au montage du composant
  useEffect(() => {
    if (lineId) {
      loadDiagram(lineId);
    }
  }, [lineId, loadDiagram]);

  // Convertir le blob SVG en chaîne et initialiser SVG.js
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

  // Initialiser SVG.js une fois que le contenu SVG est injecté dans le DOM
  useEffect(() => {
    if (svgContent && svgContainerRef.current) {
      // Attendre que le DOM soit mis à jour avec le SVG injecté
      setTimeout(() => {
        const svgElement = svgContainerRef.current?.querySelector('svg');
        if (svgElement) {
          // Initialiser SVG.js avec l'élément SVG existant
          const instance = SVG(svgElement);

          // Rendre le SVG réactif
          instance.size('100%', '100%');

          // Stocker l'instance pour une utilisation ultérieure
          setSvgInstance(instance);

          // Ajouter des classes personnalisées pour les animations
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

  // Fonction pour créer le contenu SVG de manière sécurisée
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
          <span>Chargement du diagramme...</span>
        </div>
      )}

      {error && (
        <div className="diagram-error">
          <span>Erreur lors du chargement du diagramme: {error}</span>
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
