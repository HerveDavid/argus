import { useEffect, useState } from 'react';
import { useDiagramStore } from '../../stores/use-diagram.store';

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
  const { svgBlob, isLoading, error, loadDiagram, resetDiagram } =
    useDiagramStore();
  const [svgContent, setSvgContent] = useState<string | null>(null);

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

  if (svgContent) {
    return (
      <div
        className={className}
        style={{ width, height }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  }

  return (
    <div className="flex flex-col justify-center items-center h-40 text-gray-500">
      <p>Aucun diagramme disponible</p>
      <button
        className="mt-2 px-4 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
        onClick={() => loadDiagram(lineId)}
      >
        Réessayer
      </button>
    </div>
  );
};

export default SingleLineDiagram;
