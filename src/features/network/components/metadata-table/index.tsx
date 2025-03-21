import { useEffect } from 'react';
import { useDiagramStore } from '../../stores/use-diagram.store'; // Ajustez le chemin selon votre structure
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table'; // Ajustez le chemin selon votre structure

interface MetadataTableProps {
  lineId?: string;
  className?: string;
  caption?: string;
}

const MetadataTable = ({
  lineId = 'VLGEN',
  className = '',
  caption,
}: MetadataTableProps) => {
  const { metadata, isLoading, error, loadDiagram, resetDiagram } =
    useDiagramStore();

  useEffect(() => {
    // Charger les données quand le composant est monté ou quand lineId change
    loadDiagram(lineId);

    // Nettoyer quand le composant est démonté
    return () => {
      resetDiagram();
    };
  }, [lineId, loadDiagram, resetDiagram]);

  // Fonction pour formater les clés (convertir camelCase en texte lisible)
  const formatKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  // Afficher l'état de chargement
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="text-gray-600">Chargement des métadonnées...</div>
      </div>
    );
  }

  // Afficher le message d'erreur
  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded text-red-600">
        <p className="font-medium">Erreur lors du chargement des métadonnées</p>
        <p>{error}</p>
        <button
          className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
          onClick={() => loadDiagram(lineId)}
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Afficher un message si aucune donnée n'est disponible
  if (!metadata || Object.keys(metadata).length === 0) {
    return (
      <div className="flex flex-col justify-center items-center p-6 border border-gray-200 rounded bg-gray-50 text-gray-500">
        <p>Aucune métadonnée disponible pour cette ligne</p>
        <button
          className="mt-2 px-4 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
          onClick={() => loadDiagram(lineId)}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <Table className={className}>
      {caption && <TableCaption>{caption}</TableCaption>}
      <TableHeader>
        <TableRow>
          <TableHead>Propriété</TableHead>
          <TableHead>Valeur</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(metadata).map(([key, value]) => {
          const displayValue =
            typeof value === 'object' ? JSON.stringify(value) : String(value);

          return (
            <TableRow key={key}>
              <TableCell className="font-medium">{formatKey(key)}</TableCell>
              <TableCell>{displayValue}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default MetadataTable;
