import { updateFeedersBatch } from '@/features/diagram/utils/update-feeder';
import { DiagramEvent } from '@/types/diagram-event';
import { Channel, invoke } from '@tauri-apps/api/core';
import { useCallback, useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface FeederUpdaterProps {
  elementId: string;
  svgRef: React.RefObject<SVGSVGElement>;
}

export const useFeederUpdater = ({ elementId, svgRef }: FeederUpdaterProps) => {
  // Utiliser useRef pour éviter de recréer le channel à chaque render
  const channelRef = useRef<Channel<DiagramEvent> | null>(null);
  const isSubscribedRef = useRef(false);

  // Créer le channel une seule fois
  if (!channelRef.current) {
    channelRef.current = new Channel<DiagramEvent>((event) => {
      console.log('Channel event received:', event);
      if (event.tag === 'FeederUpdate') {
        updateFeedersBatch(svgRef, event.content.feeders);
      }
    });
  }

  const resetAllFeeders = useCallback(
    (resetValue: string = '****') => {
      if (!svgRef.current) return false;

      const svgElement = d3.select(svgRef.current);
      const feederLabels = svgElement.selectAll('.sld-feeder-info .sld-label');

      if (feederLabels.empty()) return false;

      feederLabels.text(resetValue);
      return true;
    },
    [svgRef],
  );

  useEffect(() => {
    let isMounted = true;

    const setupSubscription = async () => {
      if (isSubscribedRef.current || !channelRef.current) return;

      try {
        await invoke('add_subscription', {
          element_id: elementId,
          channel: channelRef.current,
        });

        if (isMounted) {
          isSubscribedRef.current = true;
        }
      } catch (error) {
        console.error('Failed to setup subscription:', error);
      }
    };

    const cleanupSubscription = async () => {
      if (!isSubscribedRef.current) return;

      try {
        await invoke('remove_subscription', { element_id: elementId });
        isSubscribedRef.current = false;
      } catch (error) {
        console.error('Failed to cleanup subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      cleanupSubscription();
    };
  }, [elementId]); // Seul elementId dans les dépendances

  return { resetAllFeeders } as const;
};
