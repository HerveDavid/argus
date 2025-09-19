import { Result, useAtom } from '@effect-atom/atom-react';
import React, { createContext, useContext } from 'react';
import { loadSldMetadata } from '../services/metadata.service';
import { PowsyblError } from '@/services/common/powsybl-client';
import { EcsError } from '@/services/common/ecs-client/errors';
import { SldMetadata } from '@/types/sld-metadata';

type MetadataContextType = {
  elementId: string;
  metadata: Result.Result<
    {
      readonly metadata: SldMetadata;
      readonly svg: string;
    },
    PowsyblError | EcsError
  >;
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

  // React useEffect
  React.useEffect(() => {
    load();
  }, [elementId]);

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
    return () => {};
  }, [elementId]);

  return (
    <MetadataContext.Provider value={store}>
      {children}
    </MetadataContext.Provider>
  );
};
