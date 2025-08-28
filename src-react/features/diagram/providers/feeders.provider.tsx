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

  // Todo
  // const [outputs, loadOutputs] = useAtom(getOutputs);

  const getSvgRef = useCallback(() => {
    return svgRef;
  }, [svgRef, isInitialized]);

  const feedersAtom = React.useMemo(() => {
    if (!isInitialized) {
      return null;
    }

    return Result.match(metadata, {
      onInitial: () => null,
      onFailure: () => null,
      onSuccess: ({ value }) => {
        // // Todo
        // loadOutputs(value.metadata);

        console.log(JSON.stringify(value.metadata));

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
    if (isInitialized && feedersAtom && loadFeedersAction) {
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
