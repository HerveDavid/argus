import { SldDiagram } from '@/types/sld-diagram';

export const DiagramFooter: React.FC<{
  isLoading: boolean;
  isLoaded: boolean;
  isError: boolean;
  diagramData: SldDiagram | null;
}> = ({ isLoading, isLoaded, isError, diagramData }) => {
  const getStatus = () => {
    if (isLoading) return 'Loading';
    if (isLoaded) return 'Loaded';
    if (isError) return 'Error';
    return 'Idle';
  };

  return (
    <div className="flex justify-between items-center w-full text-sm text-muted-foreground">
      <span>Status: {getStatus()}</span>
    </div>
  );
};
