import { useState, useEffect } from 'react';
import { getSingleLineDiagram } from '../../api/get-single-line-diagram';

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
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDiagram() {
      try {
        setLoading(true);
        setError(null);

        // Récupérer le SVG comme Blob
        const blob = await getSingleLineDiagram(lineId);

        // Lire le contenu du Blob en tant que texte
        const text = await blob.text();

        if (isMounted) {
          setSvgContent(text);
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setError(
            'Erreur lors du chargement du diagramme. Veuillez réessayer.',
          );
          setLoading(false);
          console.error('Failed to load diagram:', error);
        }
      }
    }

    loadDiagram();

    return () => {
      isMounted = false;
    };
  }, [lineId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        Chargement du diagramme...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  // Afficher le SVG directement dans le DOM
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
