import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';

import { useCentralPanelStore } from '@/stores/central-panel.store';

import { useFeederUpdater } from '../features/diagram-feeders/hooks/use-update-feevers-v2';
import { useLineGoTo, useSvgNavigation } from '../features/diagram-navigation';
import {
  useSvgManager,
  useBreakerToggle,
} from '../features/diagram-visualization';
import {
  EquipmentControls,
  useEquipmentControls,
} from '../features/equipment-controls';
import { useSldContext } from '../providers/sld.provider';
import { Channel, invoke } from '@tauri-apps/api/core';
import { DiagramEvent } from '@/types/diagram-event';
import { updateFeedersBatch } from '@/features/diagram/utils/update-feeder';

export const DiagramContent = () => {
  const { currentId, svgRef, diagramData } = useSldContext();
  const { setupZoom, restoreTransform } = useSvgNavigation();
  const { isInitialized, initializeSvg, updateSvg, ensureZoomGroup } =
    useSvgManager(svgRef);
  const { toggleBreaker } = useBreakerToggle(svgRef);
  const { targetElement, handleContextMenuTrigger } = useEquipmentControls();

  // const channelRef = useRef(
  //   new Channel((event: DiagramEvent) => {
  //     console.log('Channel event received:', event);
  //     if (event.tag === 'FeederUpdate') {
  //       updateFeedersBatch(svgRef, event.content.feeders);
  //     }
  //   }),
  // );

  // Utilise seulement useFeederUpdater avec les bons paramètres
  // const { updateFeeder, resetAllFeeders, getAllFeederIds, isSubscribed } =
  //   useFeederUpdater({
  //     svgRef,
  //     metadata: diagramData?.metadata, // Utilise metadata, pas diagramData entier
  //   });

  const { resetAllFeeders } = useFeederUpdater({
    elementId: diagramData!.element_id.toString(),
    svgRef,
  });

  const { addPanel } = useCentralPanelStore();
  const feedersInitialized = useRef(false);

  const goto = (id: string) => {
    addPanel({
      id,
      tabComponent: 'default',
      component: 'sld',
      params: { id },
    });
  };

  useLineGoTo({
    svgRef,
    metadata: diagramData?.metadata,
    onGoToVoltageLevel: goto,
  });

  useEffect(() => {
    if (!diagramData?.svg || !svgRef.current) return;

    feedersInitialized.current = false;

    if (!isInitialized) {
      initializeSvg(diagramData.svg).then(() => {
        const svg = d3.select(svgRef.current!);
        setupZoom(svg);

        // awaitinvoke('add_subscription', {
        //   element_id: currentId,
        //   channel: channelRef.current, // Utiliser directement le channel fourni
        // });
        // Optionnel : reset des feeders après initialisation
        setTimeout(() => {
          resetAllFeeders('---');
        }, 100);
      });
    } else {
      const svg = d3.select(svgRef.current);
      const zoomGroup = ensureZoomGroup(svg);
      updateSvg(diagramData.svg, diagramData.metadata, () => {
        restoreTransform(zoomGroup);

        // Reset des feeders après mise à jour
        setTimeout(() => {
          resetAllFeeders('---');
        }, 100);
      });
    }
  }, [
    diagramData?.svg,
    diagramData?.metadata,
    isInitialized,
    initializeSvg,
    updateSvg,
    ensureZoomGroup,
    restoreTransform,
    setupZoom,
    resetAllFeeders,
  ]);

  return (
    <div className="relative flex h-full flex-col">
      <div className="bg-background flex-1 overflow-hidden rounded border-0">
        <EquipmentControls
          targetElement={targetElement}
          onToggleBreaker={toggleBreaker}
          metadata={diagramData?.metadata}
          onGoToVoltageLevel={goto}
        >
          <svg
            ref={svgRef}
            className="h-full w-full cursor-default"
            style={{ minHeight: '400px' }}
            onContextMenu={handleContextMenuTrigger}
          />
        </EquipmentControls>
      </div>
    </div>
  );
};
