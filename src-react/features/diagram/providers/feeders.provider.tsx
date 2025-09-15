import { Result, useAtom } from '@effect-atom/atom-react';
import React, { createContext } from 'react';

import { useMetadata } from './metadata.provider';
import { subscribeToFeeders } from '../services/feeders.service';
import { useDiagram } from './diagram.provider';
import { Channel } from '@tauri-apps/api/core';
import { ScadaMessage } from '@/types/tstm';
import { updateFeeder, updateFeedersBatch } from '../utils/update-feeder';
import { DiagramEvent } from '@/types/diagram-event';

type FeedersContextType = {
  isSubscribing: boolean;
  scadaChannel: React.RefObject<Channel<ScadaMessage> | undefined>;
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
  const { metadata } = useMetadata();
  const { svgRef, isInitialized } = useDiagram();

  const [subscriptionId] = React.useState(() => crypto.randomUUID());
  const scadaChannel = React.useRef<Channel<ScadaMessage>>(undefined);

  const subscriptionAtom = React.useMemo(() => {
    if (!isInitialized) return null;

    return Result.match(metadata, {
      onInitial: () => null,
      onFailure: () => null,
      onSuccess: ({ value }) => {
        value.channel.onmessage = (event: DiagramEvent) => {
          if (event.tag === 'FeederUpdate') {
            updateFeedersBatch(svgRef, event.content.feeders);
          }
        };
      },
    });
  }, [metadata, isInitialized, subscriptionId, svgRef]);

  const [subscriptionResult, executeSubscription] = useAtom(
    subscriptionAtom || subscribeToFeeders({} as any),
  );

  const isSubscribing = Result.isInitial(subscriptionResult);

  React.useEffect(() => {
    if (isInitialized && subscriptionAtom && executeSubscription) {
      executeSubscription();
    }
  }, [subscriptionAtom, executeSubscription, isInitialized, subscriptionId]);

  const contextValue = React.useMemo(
    () => ({
      isSubscribing,
      scadaChannel,
      subscriptionId,
    }),
    [isSubscribing, subscriptionId],
  );

  return (
    <FeedersContext.Provider value={contextValue}>
      {children}
    </FeedersContext.Provider>
  );
};
