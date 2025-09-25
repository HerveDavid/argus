import { useAtomSet } from '@effect-atom/atom-react';
import { Exit } from 'effect';
import React, { createContext } from 'react';

import { useMetadata } from './metadata.provider';
import { useDiagram } from './diagram.provider';
import { updateFeedersBatch } from '../utils/update-feeder';
import { DiagramEvent } from '@/types/diagram-event';
import { Channel } from '@tauri-apps/api/core';
import {
  addChannelFeeders,
  removeChannelFeeders,
} from '../services/metadata.service';

type FeedersContextType = {
  channel: React.RefObject<Channel<DiagramEvent>>;
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
  const { elementId } = useMetadata();
  const { svgRef, isInitialized } = useDiagram();

  const channel = React.useRef(
    new Channel<DiagramEvent>((event) => {
      console.log('Channel event received:', event);
      if (event.tag === 'FeederUpdate') {
        updateFeedersBatch(svgRef, event.content.feeders);
      }
    }),
  );

  // Utiliser useAtomSet avec mode "promiseExit" pour obtenir une Promise
  const addChannel = useAtomSet(
    addChannelFeeders({
      elementId,
      channel: channel.current,
    }),
    { mode: 'promiseExit' },
  );

  const removeChannel = useAtomSet(
    removeChannelFeeders({
      elementId,
    }),
    { mode: 'promiseExit' },
  );

  React.useEffect(() => {
    let cancelled = false;

    if (isInitialized) {
      console.log('About to add channel for elementId:', elementId);

      // addChannel retourne maintenant une Promise<Exit<...>>
      addChannel()
        .then((exit) => {
          if (cancelled) return;
          console.log('AddChannel result:', exit);
          if (Exit.isSuccess(exit)) {
            console.log('Channel added successfully:', exit.value);
          } else {
            console.error('Error adding channel:', exit.toJSON());
            console.error('Error details:', exit.cause);
          }
        })
        .catch((error) => {
          console.error('Promise rejected:', error);
        });
    }

    return () => {
      cancelled = true;
      removeChannel().then(console.log).catch(console.error);
    };
  }, [isInitialized, elementId]);

  const contextValue = React.useMemo(() => ({ channel }), []);

  return (
    <FeedersContext.Provider value={contextValue}>
      {children}
    </FeedersContext.Provider>
  );
};
