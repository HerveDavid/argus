import { Loader2 } from 'lucide-react';
import React from 'react';

export const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center h-full border rounded">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-muted-foreground">Loading diagram...</p>
    </div>
  </div>
);
