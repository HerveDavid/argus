import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

import { useCentralPanelStore } from '@/stores/central-panel.store';

import {
  useFeederUpdater, // Garde seulement celui-ci
} from '../features/diagram-feeders';
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

export const DiagramContent = () => {
  const { svgRef, diagramData } = useSldContext();
  const { setupZoom, restoreTransform } = useSvgNavigation();
  const { isInitialized, initializeSvg, updateSvg, ensureZoomGroup } =
    useSvgManager(svgRef);
  const { toggleBreaker } = useBreakerToggle(svgRef);
  const { targetElement, handleContextMenuTrigger } = useEquipmentControls();

  // Utilise seulement useFeederUpdater avec les bons paramètres
  const { updateFeeder, resetAllFeeders, getAllFeederIds, isSubscribed } =
    useFeederUpdater({
      svgRef,
      metadata: diagramData?.metadata, // Utilise metadata, pas diagramData entier
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

  // Debug - affiche l'état de la souscription SCADA
  useEffect(() => {
    if (isSubscribed) {
      console.log('SCADA subscription active');
      const feederIds = getAllFeederIds();
      console.log('Available feeder IDs:', feederIds);
    }
  }, [isSubscribed, getAllFeederIds]);

  // Fonction utilitaire pour tester les feeders manuellement (dev uniquement)
  const testFeeders = () => {
    const feederIds = getAllFeederIds();
    feederIds.forEach((id, index) => {
      setTimeout(() => {
        updateFeeder(id, Math.floor(Math.random() * 100));
      }, index * 500);
    });
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Bouton de test en dev uniquement */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 z-10 space-x-2">
          <button
            onClick={testFeeders}
            className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
          >
            Test Feeders
          </button>
          <button
            onClick={() => resetAllFeeders('0')}
            className="px-2 py-1 bg-gray-500 text-white text-xs rounded"
          >
            Reset
          </button>
        </div>
      )}

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
