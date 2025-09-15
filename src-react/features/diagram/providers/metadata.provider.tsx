import { Result, useAtom } from '@effect-atom/atom-react';
import React, { createContext, useContext } from 'react';
import {
  loadSldMetadata,
  unloadSldMetadata,
} from '../services/metadata.service';
import { Metadata } from '../types/metadata.type';
import { PowsyblError } from '@/services/common/powsybl-client';
import { EcsError } from '@/services/common/ecs-client/errors';

type MetadataContextType = {
  elementId: string;
  metadata: Result.Result<Metadata, PowsyblError | EcsError>;
};

const MetadataContext = createContext<MetadataContextType | undefined>(
  undefined,
);

export const useMetadata = () => {
  const context = useContext(MetadataContext);
  if (!context) {
    throw new Error('useMetadata must be used within MetadataProvider');
  }
  return context;
};

export const MetadataProvider = ({
  children,
  elementId,
}: {
  children: React.ReactNode;
  elementId: string;
}) => {
  // Effect-ts
  const metadataAtom = loadSldMetadata(elementId);
  const [metadata, load] = useAtom(metadataAtom);

  const removeAtom = unloadSldMetadata(elementId);
  const [_, unload] = useAtom(removeAtom);

  // React useEffect
  React.useEffect(() => {
    load();
  }, [elementId, load]);

  // Context
  const store = React.useMemo(
    () => ({
      elementId,
      metadata,
    }),
    [elementId, metadata],
  );

  // Unmount
  React.useEffect(() => {
    return () => unload();
  }, [elementId, unload]);

  return (
    <MetadataContext.Provider value={store}>
      {children}
    </MetadataContext.Provider>
  );
};
