import { LiveManagedRuntime } from '@/config/live-layer';
import { StoreRuntime } from '@/hooks/use-store-runtime';
import { SldDiagram } from '@/types/sld-diagram';

export interface DiagramReloaderStore extends StoreRuntime {
  // State
  state:
    | 'error'
    | 'idle'
    | 'loaded'
    | 'loading'
    | 'waitingForRuntime'
    | 'refreshing';
  context: any;

  // Computed States
  isLoading: boolean;
  isLoaded: boolean;
  isError: boolean;
  isIdle: boolean;
  isWaitingForRuntime: boolean;
  isRefreshing: boolean;

  // Data
  diagramData: SldDiagram | null;
  error: string | null;
  lineId: string | null;
  cacheSize: number;
  lastUpdate: Date | null;
  isAutoRefreshEnabled: boolean;

  // Load Actions
  loadDiagram: (lineId: string) => void;
  clearDiagram: () => void;
  clearCache: () => void;
  retry: () => void;

  // Refresh Actions
  enableAutoRefresh: () => void;
  disableAutoRefresh: () => void;
  manualRefresh: () => void;

  // Helpers
  isInCache: (lineId: string) => boolean;
  getCachedIds: () => string[];
  getTimeSinceLastUpdate: () => number | null; // millisecondes
  getFormattedLastUpdate: () => string | null;

  // Effect Runtime
  runtime: LiveManagedRuntime | null;
  setRuntime: (runtime: LiveManagedRuntime) => void;
}
