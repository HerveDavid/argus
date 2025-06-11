import React from 'react';

import { LiveManagedRuntime } from '@/services/live-layer';
import { useRuntime } from '@/services/runtime/use-runtime';

export interface StoreRuntime {
  runtime: LiveManagedRuntime | null;
  setRuntime: (runtime: LiveManagedRuntime) => void;
}

export function useStoreRuntime<T extends StoreRuntime>(
  useStore: () => T,
): Omit<T, 'runtime' | 'setRuntime'> & {
  isReady: boolean;
} {
  const store = useStore();
  const runtime = useRuntime();

  React.useEffect(() => {
    if (runtime && store.runtime !== runtime) {
      store.setRuntime(runtime);
    }
  }, [runtime, store.runtime, store.setRuntime]);

  const { runtime: _, setRuntime: __, ...storeWithoutRuntime } = store;

  return {
    ...storeWithoutRuntime,
    isReady: !!store.runtime,
  } as any;
}
