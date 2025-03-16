import { useEffect, useState } from 'react';
import { useDiagramStore } from '../../stores/use-diagram.store'; // Ajustez le chemin d'importation selon votre structure

interface SingleLineDiagramProps {
  lineId?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}

const SingleLineDiagram = ({
  lineId = 'VLGEN',
  width = '100%',
  height = 'auto',
  className = '',
}: SingleLineDiagramProps) => {
  // Utilisation du store Zustand
  const { svgBlob, isLoading, error, loadDiagram, resetDiagram } =
    useDiagramStore();
  // État local pour stocker le contenu SVG en tant que chaîne
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    // Charger le diagramme quand le composant est monté ou quand lineId change
    loadDiagram(lineId);

    // Nettoyer quand le composant est démonté
    return () => {
      resetDiagram();
    };
  }, [lineId]);

  // Convertir le blob en texte quand il est disponible
  useEffect(() => {
    if (svgBlob) {
      svgBlob.text().then((text) => {
        setSvgContent(text);
      });
    } else {
      setSvgContent(null);
    }
  }, [svgBlob]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        Chargement du diagramme...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  // Afficher le SVG en utilisant dangerouslySetInnerHTML
  if (svgContent) {
    return (
      <div
        className={className}
        style={{ width, height }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  }

  return null;
};

export default SingleLineDiagram;
