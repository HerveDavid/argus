import { Result, useAtom } from '@effect-atom/atom-react';
import React, { createContext } from 'react';

import { useMetadata } from './metadata.provider';
import { loadFeeders, removeFeeders } from '../services/feeders.service';
import { ScadaError, ScadaOutput } from '@/services/common/scada-client';

type FeedersContextType = {
  feeders: Result.Result<ScadaOutput[], ScadaError> | null;
  isLoadingFeeders: boolean;
};

const FeedersContext = createContext<FeedersContextType | undefined>(undefined);

export const FeedersProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { metadata } = useMetadata();
  const [_, remove] = useAtom(removeFeeders);

  const feedersAtom = React.useMemo(() => {
    return Result.match(metadata, {
      onInitial: () => null,
      onFailure: () => null,
      onSuccess: ({ value }) => loadFeeders(value.metadata),
    });
  }, [metadata]);

  const [feeders, loadFeedersAction] = useAtom(
    feedersAtom || loadFeeders({} as any),
  );

  const isLoadingFeeders = Result.isInitial(feeders);

  React.useEffect(() => {
    if (feedersAtom && loadFeedersAction) {
      loadFeedersAction();
    }
  }, [feedersAtom, loadFeedersAction]);

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
