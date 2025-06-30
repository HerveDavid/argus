import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CombinedButtonProps {
  isAutoRefreshEnabled: boolean;
  isRefreshing: boolean;
  isLoading: boolean;
  onToggleAutoRefresh: () => void;
  onManualRefresh: () => void;
}

export const CombinedButton: React.FC<CombinedButtonProps> = ({
  isAutoRefreshEnabled,
  isRefreshing,
  isLoading,
  onToggleAutoRefresh,
  onManualRefresh,
}) => {
  const isRefreshDisabled = isRefreshing || isLoading;

  return (
    <div className="flex items-center border border-border rounded-md overflow-hidden bg-card">
      {/* Bouton Refresh à gauche */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onManualRefresh}
        disabled={isRefreshDisabled}
        className={cn(
          'h-8 px-3 rounded-none border-r border-border hover:bg-accent hover:text-accent-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isRefreshDisabled && 'opacity-50 cursor-not-allowed',
        )}
        title="Actualiser"
        aria-label="Actualiser"
      >
        <RefreshCw
          className={cn(
            'size-3 transition-transform',
            isRefreshing && 'animate-spin',
          )}
        />
      </Button>

      {/* Switch Auto/Manuel à droite */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleAutoRefresh}
        className={cn(
          'h-8 px-3 rounded-none text-xs font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isAutoRefreshEnabled
            ? 'text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )}
        title={isAutoRefreshEnabled ? 'Auto' : 'Manuel'}
        aria-label={
          isAutoRefreshEnabled
            ? 'Enable Auto-Refresh Mode'
            : 'Enable Manuel Mode'
        }
      >
        {isAutoRefreshEnabled ? 'AUTO' : 'MANUEL'}
      </Button>
    </div>
  );
};
