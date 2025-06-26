import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import React from 'react';

export const ErrorState: React.FC<{
  error: string | null;
  onRetry: () => void;
}> = ({ error, onRetry }) => (
  <div className="flex items-center justify-center h-full">
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="text-destructive">
        <p className="font-semibold">Loading Error</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
      <Button onClick={onRetry} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  </div>
);
