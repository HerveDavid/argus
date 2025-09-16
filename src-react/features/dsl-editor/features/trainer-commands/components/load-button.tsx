import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDsl } from '@/features/dsl-editor/provider/dsl.provider';

export const LoadButton = () => {
  const { loadDsl } = useDsl();

  return (
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={loadDsl}>
      <Upload size={16} />
    </Button>
  );
};
