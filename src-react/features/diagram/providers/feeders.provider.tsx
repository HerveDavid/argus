import { Result, useAtom } from '@effect-atom/atom-react';
import React, { createContext, useCallback } from 'react';

import { useMetadata } from './metadata.provider';
import { loadFeeders, removeFeeders } from '../services/feeders.service';
import { useDiagram } from './diagram.provider';
import { Channel } from '@tauri-apps/api/core';
import { ScadaMessage } from '@/types/tstm';

type FeedersContextType = {
  isLoadingFeeders: boolean;
  channelRef: React.RefObject<Channel<ScadaMessage> | undefined>;
  subscriptionId: string;
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
  // Hooks
  const { metadata } = useMetadata();
  const { svgRef, isInitialized } = useDiagram();

  // States & Actions
  const [subscriptionId] = React.useState(() => crypto.randomUUID());
  const channelRef = React.useRef<Channel<ScadaMessage>>(undefined);

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
        if (channelRef.current) {
          return loadFeeders({
            metadata: value.metadata,
            id: subscriptionId,
            channelRef,
          });
        }
      },
    });
  }, [metadata, getSvgRef, isInitialized]);

  const [feeders, loadFeedersAction] = useAtom(
    feedersAtom || loadFeeders({} as any),
  );

  const removeFeedersAtom = React.useMemo(() => {
    return removeFeeders({ id: subscriptionId });
  }, [subscriptionId]);

  const [, removeFeedersAction] = useAtom(removeFeedersAtom);

  const isLoadingFeeders = Result.isInitial(feeders);

  React.useEffect(() => {
    if (!channelRef.current) {
      const channel = new Channel<ScadaMessage>();
      channel.onmessage = (message) => {
        console.log('SCADA Message received:', message);
      };
      channelRef.current = channel;
    }

    return () => {
      if (channelRef.current) {
        if (removeFeedersAction) {
          removeFeedersAction();
        }
        channelRef.current = undefined;
      }
    };
  }, []);

  React.useEffect(() => {
    if (isInitialized && feedersAtom && loadFeedersAction) {
      loadFeedersAction();
    }
  }, [feedersAtom, loadFeedersAction, isInitialized]);

  const store = React.useMemo(
    () => ({
      isLoadingFeeders,
      channelRef,
      subscriptionId,
    }),
    [feeders, feedersAtom, isLoadingFeeders],
  );

  return (
    <FeedersContext.Provider value={store}>{children}</FeedersContext.Provider>
  );
};
