import { Result, useAtom } from '@effect-atom/atom-react';
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
      if (event.tag === 'FeederUpdate') {
        updateFeedersBatch(svgRef, event.content.feeders);
      }
    }),
  );

  const channelAtom = addChannelFeeders({
    elementId,
    channel: channel.current,
  });
  const [_, addChannel] = useAtom(channelAtom);

  React.useEffect(() => {
    if (isInitialized) {
      addChannel();
    }
  }, [isInitialized]);

  const contextValue = React.useMemo(() => ({ channel }), []);

  return (
    <FeedersContext.Provider value={contextValue}>
      {children}
    </FeedersContext.Provider>
  );
};
