import React, { createContext } from 'react';

import { useMetadata } from './metadata.provider';
import { useDiagram } from './diagram.provider';
import { updateFeedersBatch } from '../utils/update-feeder';
import { DiagramEvent } from '@/types/diagram-event';
import { Channel, invoke } from '@tauri-apps/api/core';

type FeedersContextType = {
  channel: React.RefObject<Channel<DiagramEvent> | null>;
  reconnect: () => Promise<void>;
};

const FeedersContext = createContext<FeedersContextType | undefined>(undefined);

export const useFeeders = () => {
  const context = React.useContext(FeedersContext);
  if (!context) {
    throw new Error('useFeeders must be used within FeedersProvider');
  }
  return context;
};

const useChannelSubscription = (
  elementId: string,
  isInitialized: boolean,
  svgRef: any,
) => {
  const channelRef = React.useRef<Channel<DiagramEvent> | null>(null);
  const [channelVersion, setChannelVersion] = React.useState(0);

  React.useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const newChannel = new Channel<DiagramEvent>((event) => {
      if (event.tag === 'FeederUpdate') {
        if (!svgRef.current || !document.contains(svgRef.current)) {
          return;
        }

        const rect = svgRef.current.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          return;
        }

        try {
          updateFeedersBatch(svgRef, event.content.feeders);
        } catch (error) {
          console.error('Error updating feeders:', error);
        }
      }
    });

    channelRef.current = newChannel;

    return () => {
      channelRef.current = null;
    };
  }, [elementId, isInitialized, channelVersion]);

  const recreateChannel = React.useCallback(() => {
    setChannelVersion((v) => v + 1);
  }, []);

  return { channelRef, recreateChannel };
};

export const FeedersProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { elementId } = useMetadata();
  const { svgRef, isInitialized } = useDiagram();

  const { channelRef, recreateChannel } = useChannelSubscription(
    elementId,
    isInitialized,
    svgRef,
  );
  const subscriptionIdRef = React.useRef<string | null>(null);
  const subscriptionStateRef = React.useRef<
    'idle' | 'subscribing' | 'subscribed' | 'unsubscribing'
  >('idle');
  const visibilityObserverRef = React.useRef<IntersectionObserver | null>(null);

  const unsubscribe = React.useCallback(async (targetElementId: string) => {
    if (subscriptionStateRef.current === 'unsubscribing') {
      return;
    }

    subscriptionStateRef.current = 'unsubscribing';

    try {
      await invoke('remove_subscription', {
        element_id: targetElementId,
      });
      if (subscriptionIdRef.current === targetElementId) {
        subscriptionIdRef.current = null;
      }
      subscriptionStateRef.current = 'idle';
      console.log('Unsubscribed: ' + targetElementId);
    } catch (error) {
      console.error('Error removing subscription:', error);
      subscriptionStateRef.current = 'idle';
      throw error;
    }
  }, []);

  const subscribe = React.useCallback(async () => {
    if (
      !channelRef.current ||
      !isInitialized ||
      subscriptionStateRef.current !== 'idle'
    ) {
      return;
    }

    const currentChannel = channelRef.current;
    const currentElementId = elementId;
    subscriptionStateRef.current = 'subscribing';

    try {
      await invoke('add_subscription', {
        element_id: currentElementId,
        channel: currentChannel,
      });
      subscriptionIdRef.current = currentElementId;
      subscriptionStateRef.current = 'subscribed';
      console.log('Subscribed: ' + elementId);
    } catch (error) {
      console.error('Error adding subscription:', error);
      subscriptionStateRef.current = 'idle';
      throw error;
    }
  }, [channelRef.current, elementId, isInitialized]);

  const reconnect = React.useCallback(async () => {
    if (subscriptionIdRef.current) {
      await unsubscribe(subscriptionIdRef.current);
    }
    recreateChannel();
    await new Promise((resolve) => setTimeout(resolve, 50));
    await subscribe();
  }, [unsubscribe, subscribe, recreateChannel]);

  React.useEffect(() => {
    if (!channelRef.current || !isInitialized) {
      return;
    }

    subscribe();

    return () => {
      const currentElementId = subscriptionIdRef.current;
      if (currentElementId) {
        unsubscribe(currentElementId);
      }
    };
  }, [channelRef.current, elementId, isInitialized, subscribe, unsubscribe]);

  React.useEffect(() => {
    if (!svgRef.current || !isInitialized) return;

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0) {
          if (
            subscriptionStateRef.current === 'idle' &&
            !subscriptionIdRef.current
          ) {
            subscribe();
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: [0, 0.1],
      root: null,
    });

    observer.observe(svgRef.current);
    visibilityObserverRef.current = observer;

    return () => {
      observer.disconnect();
      visibilityObserverRef.current = null;
    };
  }, [svgRef.current, isInitialized, subscribe]);

  const contextValue = React.useMemo(
    () => ({
      channel: channelRef,
      reconnect,
    }),
    [reconnect],
  );

  return (
    <FeedersContext.Provider value={contextValue}>
      {children}
    </FeedersContext.Provider>
  );
};
