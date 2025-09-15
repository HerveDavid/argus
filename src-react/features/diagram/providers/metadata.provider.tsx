import { Result, useAtom } from '@effect-atom/atom-react';
import React, { createContext, useContext } from 'react';
import {
  loadSldMetadataV2,
  unloadSldMetadata,
} from '../services/metadata.service';
import { PowsyblError } from '@/services/common/powsybl-client';
import { EcsError } from '@/services/common/ecs-client/errors';
import { DiagramEvent } from '@/types/diagram-event';
import { SldMetadata } from '@/types/sld-metadata';
import { Channel } from '@tauri-apps/api/core';

type MetadataContextType = {
  elementId: string;
  metadata: Result.Result<
    {
      readonly metadata: SldMetadata;
      readonly svg: string;
      readonly channel: Channel<DiagramEvent>;
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
  const metadataAtom = loadSldMetadataV2(elementId);
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
