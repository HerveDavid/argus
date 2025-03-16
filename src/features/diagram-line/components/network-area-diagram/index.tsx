import { useEffect, useState } from 'react';
import { useNetworkAreaDiagramStore } from '../../stores/use-network-area-diagram.store';

interface NetworkAreaDiagramProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

const NetworkAreaDiagram = ({
  width = '100%',
  height = 'auto',
  className = '',
}: NetworkAreaDiagramProps) => {
  const { svgBlob, isLoading, error, loadDiagram, resetDiagram } =
    useNetworkAreaDiagramStore();
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    loadDiagram();
    return () => {
      resetDiagram();
    };
  }, [loadDiagram, resetDiagram]);

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
        Chargement du diagramme de zone...
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
      <p>Aucun diagramme de zone disponible</p>
      <button
        className="mt-2 px-4 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
        onClick={() => loadDiagram()}
      >
        Réessayer
      </button>
    </div>
  );
};

export default NetworkAreaDiagram;
