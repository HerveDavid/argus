import { Result, useAtom } from '@effect-atom/atom-react';
import React, { createContext, useCallback } from 'react';

import { useMetadata } from './metadata.provider';
import { loadFeeders, removeFeeders } from '../services/feeders.service';
import { ScadaError, ScadaOutput } from '@/services/common/scada-client';
import { useDiagram } from './diagram.provider';

type FeedersContextType = {
  feeders: Result.Result<ScadaOutput[], ScadaError> | null;
  isLoadingFeeders: boolean;
};

const FeedersContext = createContext<FeedersContextType | undefined>(undefined);

export const useFeeders = () => {
  const context = React.useContext(FeedersContext);
  if (!context) {
    throw new Error('useFeeders must be used within FeedersProvider');
  }
  return context;
};

export const FeedersProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { metadata } = useMetadata();
  const { svgRef, isInitialized } = useDiagram();
  const [_, remove] = useAtom(removeFeeders);

  // Fonction pour obtenir la référence SVG de façon dynamique
  const getSvgRef = useCallback(() => {
    console.log('getSvgRef called:', {
      hasSvgRef: !!svgRef?.current,
      isInitialized,
      svgContent: svgRef?.current?.innerHTML?.substring(0, 100) + '...',
    });
    return svgRef;
  }, [svgRef, isInitialized]);

  const feedersAtom = React.useMemo(() => {
    // Ne créer l'atom que si le SVG est initialisé
    if (!isInitialized) {
      console.log('SVG not initialized yet, waiting...');
      return null;
    }

    return Result.match(metadata, {
      onInitial: () => null,
      onFailure: () => null,
      onSuccess: ({ value }) => {
        console.log('Creating loadFeeders atom with metadata:', value.metadata);
        return loadFeeders({
          metadata: value.metadata,
          svgRef,
        });
      },
    });
  }, [metadata, getSvgRef, isInitialized]);

  const [feeders, loadFeedersAction] = useAtom(
    feedersAtom || loadFeeders({} as any),
  );

  const isLoadingFeeders = Result.isInitial(feeders);

  React.useEffect(() => {
    // Ne charger les feeders que si le SVG est initialisé et l'atom existe
    if (isInitialized && feedersAtom && loadFeedersAction) {
      console.log('SVG is initialized, loading feeders...');
      loadFeedersAction();
    }
  }, [feedersAtom, loadFeedersAction, isInitialized]);

  React.useEffect(() => {
    return () => {
      Result.match(feeders, {
        onInitial: () => null,
        onFailure: () => null,
        onSuccess: ({ value }) => remove(value),
      });
    };
  }, []);

  const store = React.useMemo(
    () => ({
      feeders: feedersAtom ? feeders : null,
      isLoadingFeeders,
    }),
    [feeders, feedersAtom, isLoadingFeeders],
  );

  return (
    <FeedersContext.Provider value={store}>{children}</FeedersContext.Provider>
  );
};
