import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useCentralPanelStore } from '@/stores/central-panel.store';
import {
  EquipmentControls,
  useEquipmentControls,
} from '../features/equipment-controls';
import { useSldContext } from '../providers/sld.provider';
import {
  useSvgManager,
  useBreakerToggle,
} from '../features/diagram-visualization';
import { useLineGoTo, useSvgNavigation } from '../features/diagram-navigation';
import {
  useDiagramFeeders,
  useUpdateFeeders,
} from '../features/diagram-feeders';
import { useFeederStore } from '@/hooks/use-feeder';
import { useTaskStore } from '@/hooks/use-task';

export const DiagramContent = () => {
  const { svgRef, diagramData, currentId } = useSldContext();
  const { setupZoom, restoreTransform } = useSvgNavigation();
  const { isInitialized, initializeSvg, updateSvg, ensureZoomGroup } =
    useSvgManager(svgRef);
  const { toggleBreaker } = useBreakerToggle(svgRef);
  const { targetElement, handleContextMenuTrigger } = useEquipmentControls();

  // Hook pour l'initialisation des feeders (met les ****)
  useDiagramFeeders({ svgRef, metadata: diagramData?.metadata });

  // Hook simplifié pour les mises à jour (plus besoin de feederInfos)
  const {
    updateFeeder,
    updateMultipleFeeders,
    generateMockData,
    debugSvgStructure,
    getAllFeeders,
    updateAllFeeders,
  } = useUpdateFeeders({ svgRef });

  const { addNatsFeeder } = useFeederStore();
  const { startTask, closeTask } = useTaskStore();

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

        setTimeout(() => {
          feedersInitialized.current = true;
          console.log('SVG initialized, feeders ready for updates');

          // DÉMARRER LES MISES À JOUR AVEC LA NOUVELLE MÉTHODE
          const result = updateAllFeeders();
          console.log('Initial update result:', result);
        }, 1000);
      });
    } else {
      const svg = d3.select(svgRef.current);
      const zoomGroup = ensureZoomGroup(svg);
      updateSvg(diagramData.svg, diagramData.metadata, () => {
        restoreTransform(zoomGroup);

        setTimeout(() => {
          feedersInitialized.current = true;
          console.log('SVG updated, feeders ready for updates');

          // DÉMARRER LES MISES À JOUR AVEC LA NOUVELLE MÉTHODE
          const result = updateAllFeeders();
          console.log('Update result:', result);
        }, 1000);
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
    updateAllFeeders,
  ]);

  // MISES À JOUR PÉRIODIQUES - TOUTES LES SECONDES
  useEffect(() => {
    if (!feedersInitialized.current) return;

    console.log('Starting real-time feeder updates (every 1 second)...');

    const interval = setInterval(() => {
      if (feedersInitialized.current) {
        const result = updateAllFeeders();
        console.log(
          `🔄 Real-time update: ${result.successCount}/${result.total} feeders updated`,
        );
      }
    }, 1000); // ✅ TOUTES LES SECONDES

    return () => {
      console.log('Stopping real-time feeder updates');
      clearInterval(interval);
    };
  }, [updateAllFeeders]);

  // EXPOSITION GLOBALE POUR DEBUG
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).updateFeeder = updateFeeder;
      (window as any).generateMockData = generateMockData;
      (window as any).updateMultipleFeeders = updateMultipleFeeders;
      (window as any).debugSvgStructure = debugSvgStructure;
      (window as any).getAllFeeders = getAllFeeders;
      (window as any).updateAllFeeders = updateAllFeeders;
      (window as any).testFeeders = () => {
        console.log('=== MANUAL TEST ===');
        const feeders = debugSvgStructure();
        const result = updateAllFeeders();
        console.log('Test result:', result);
        return { feeders, result };
      };
    }
  }, [
    updateFeeder,
    generateMockData,
    updateMultipleFeeders,
    debugSvgStructure,
    getAllFeeders,
    updateAllFeeders,
  ]);

  useEffect(() => {
    addNatsFeeder(currentId, () => {}).then(() => startTask(currentId));

    return () => {
      closeTask(currentId);
    };
  }, []);

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-hidden bg-background border-0 rounded">
        <EquipmentControls
          targetElement={targetElement}
          onToggleBreaker={toggleBreaker}
          metadata={diagramData?.metadata}
          onGoToVoltageLevel={goto}
        >
          <svg
            ref={svgRef}
            className="w-full h-full cursor-default"
            style={{ minHeight: '400px' }}
            onContextMenu={handleContextMenuTrigger}
          />
        </EquipmentControls>
      </div>
    </div>
  );
};
