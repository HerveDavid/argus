import { Result, useAtomSet } from '@effect-atom/atom-react';
import { Exit } from 'effect';
import React, { createContext } from 'react';

import { useMetadata } from './metadata.provider';
import { useDiagram } from './diagram.provider';
import { updateFeedersBatch } from '../utils/update-feeder';
import { DiagramEvent } from '@/types/diagram-event';
import { Channel } from '@tauri-apps/api/core';
import { addChannelFeeders } from '../services/metadata.service';

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

  React.useEffect(() => {
    if (isInitialized) {
      console.log('About to add channel for elementId:', elementId);

      // addChannel retourne maintenant une Promise<Exit<...>>
      addChannel()
        .then((exit) => {
          console.log('AddChannel result:', exit);
          if (Exit.isSuccess(exit)) {
            console.log('Channel added successfully:', exit.value);
          } else {
            console.error('Error adding channel:', exit.toJSON());
            // Ou pour plus de détails:
            console.error('Error details:', exit.cause);
          }
        })
        .catch((error) => {
          console.error('Promise rejected:', error);
        });
    }
  }, [isInitialized, elementId]);

  const contextValue = React.useMemo(() => ({ channel }), []);

  return (
    <FeedersContext.Provider value={contextValue}>
      {children}
    </FeedersContext.Provider>
  );
};

// Alternative: Si vous voulez juste une Promise qui résout la valeur ou rejette
export const FeedersProviderAlternative = ({
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

  // Utiliser mode "promise" pour obtenir une Promise qui résout ou rejette
  const addChannel = useAtomSet(
    addChannelFeeders({
      elementId,
      channel: channel.current,
    }),
    { mode: 'promise' },
  );

  React.useEffect(() => {
    if (isInitialized) {
      console.log('About to add channel for elementId:', elementId);

      // addChannel retourne une Promise<Success>
      addChannel()
        .then((result) => {
          console.log('Channel added successfully:', result);
        })
        .catch((error) => {
          console.error('Error adding channel:', error);
        });
    }
  }, [isInitialized, elementId]);

  const contextValue = React.useMemo(() => ({ channel }), []);

  return (
    <FeedersContext.Provider value={contextValue}>
      {children}
    </FeedersContext.Provider>
  );
};
