import { Result, useAtom } from '@effect-atom/atom-react';
import React, { createContext } from 'react';

import { useMetadata } from './metadata.provider';
import {
  subscribeToFeeders,
  unsubscribeFromFeeders,
} from '../services/feeders.service';
import { useDiagram } from './diagram.provider';
import { Channel } from '@tauri-apps/api/core';
import { ScadaMessage } from '@/types/tstm';
import { updateFeeder } from '../utils/update-feeder';

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
        if (scadaChannel.current) {
          return subscribeToFeeders({
            metadata: value.metadata,
            subscriptionId,
            scadaChannel,
          });
        }
        return null;
      },
    });
  }, [metadata, isInitialized, subscriptionId]);

  const unsubscriptionAtom = React.useMemo(() => {
    return unsubscribeFromFeeders({ subscriptionId });
  }, [subscriptionId]);

  const [subscriptionResult, executeSubscription] = useAtom(
    subscriptionAtom || subscribeToFeeders({} as any),
  );

  const [, executeUnsubscription] = useAtom(unsubscriptionAtom);

  const isSubscribing = Result.isInitial(subscriptionResult);

  React.useEffect(() => {
    if (!scadaChannel.current) {
      const channel = new Channel<ScadaMessage>();

      channel.onmessage = (message) => {
        switch (message.format) {
          case 'Legacy':
            updateFeeder(svgRef, message.graphical_id, message.value!);
            break;
          case 'TS_TM':
            updateFeeder(svgRef, message.graphical_id, message.value!);
            break;
        }
      };

      scadaChannel.current = channel;
    }

    return () => {
      if (scadaChannel.current) {
        if (executeUnsubscription) {
          executeUnsubscription();
        }

        scadaChannel.current = undefined;
      }
    };
  }, [subscriptionId, executeUnsubscription]);

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
