import React, { useCallback } from 'react';
import { CardAction, CardTitle } from '@/components/ui/card';
import { useSldContext } from '../providers/sld.provider';
import { CombinedButton } from './combined-button';

export interface DiagramHeaderProps {
  id: string;
  hasDataRef: React.MutableRefObject<boolean>;
}

export const DiagramHeader: React.FC<DiagramHeaderProps> = ({ id }) => {
  const {
    isRefreshing,
    isAutoRefreshEnabled,
    isLoading,
    enableAutoRefresh,
    disableAutoRefresh,
    manualRefresh,
  } = useSldContext();

  const handleToggleAutoRefresh = useCallback(() => {
    if (isAutoRefreshEnabled) {
      disableAutoRefresh();
    } else {
      enableAutoRefresh();
    }
  }, [isAutoRefreshEnabled, disableAutoRefresh, enableAutoRefresh]);

  const handleManualRefresh = useCallback(() => {
    if (!isRefreshing && !isLoading) {
      manualRefresh();
    }
  }, [isRefreshing, isLoading, manualRefresh]);

  return (
    <header className="flex items-center justify-between" role="banner">
      <CardTitle className="flex items-center ml-4">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-medium truncate">{id}</h1>
        </div>
      </CardTitle>

      <CardAction>
        <CombinedButton
          isAutoRefreshEnabled={isAutoRefreshEnabled}
          isRefreshing={isRefreshing}
          isLoading={isLoading}
          onToggleAutoRefresh={handleToggleAutoRefresh}
          onManualRefresh={handleManualRefresh}
        />
      </CardAction>
    </header>
  );
};
