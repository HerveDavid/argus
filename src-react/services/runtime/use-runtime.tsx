import React from 'react';

import { RuntimeContext } from './runtime-context';

import { type LiveManagedRuntime } from '@/config/live-layer';

export const useRuntime = (): LiveManagedRuntime => {
  const runtime = React.useContext(RuntimeContext);
  if (runtime === null)
    throw new Error('useRuntime must be used within a RuntimeProvider');
  return runtime;
};
