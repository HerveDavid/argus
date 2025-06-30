import React from 'react';
import { CardAction, CardTitle } from '@/components/ui/card';

export interface DiagramHeaderProps {
  isRefreshing: boolean;
  isError: boolean;
  isAutoRefreshEnabled: boolean;
  hasDataRef: React.MutableRefObject<boolean>;
  id: string;
}

export const DiagramHeader: React.FC<DiagramHeaderProps> = ({
  isRefreshing,
  isError,
  isAutoRefreshEnabled,
  hasDataRef,
  id,
}) => {
  return (
    <div>
      <CardTitle>
        <div className="flex text-xs items-center">
          <div className="flex items-center gap-2">
            {isRefreshing && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            )}
            {isError && hasDataRef.current && (
              <div
                className="w-2 h-2 bg-yellow-500 rounded-full"
                title="Refresh Error"
              />
            )}
            {isAutoRefreshEnabled && (
              <div
                className="w-2 h-2 bg-green-500 rounded-full"
                title="Auto-refresh"
              />
            )}
            <h1>{id}</h1>
          </div>
        </div>
      </CardTitle>
      <CardAction />
    </div>
  );
};
