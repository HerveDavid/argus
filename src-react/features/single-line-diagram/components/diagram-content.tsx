import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

import { useCentralPanelStore } from '@/stores/central-panel.store';

import {
  useDiagramFeeders,
  useSubscribeScadaFeeders,
  useUpdateFeeders,
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
import { ScadaDataPoint } from '@/services/common/scada-client';
import { scadaUpdateFeedersAtom } from '../providers/diagram.provider/atoms';
import { Result, useAtom } from '@effect-atom/atom-react';
import { useDiagram } from '../providers/diagram.provider';

export const DiagramContent = () => {
  const { svgRef, diagramData } = useSldContext();
  const { setupZoom, restoreTransform } = useSvgNavigation();
  const { isInitialized, initializeSvg, updateSvg, ensureZoomGroup } =
    useSvgManager(svgRef);
  const { toggleBreaker } = useBreakerToggle(svgRef);
  const { targetElement, handleContextMenuTrigger } = useEquipmentControls();

  const { isLoaded, metadataRef, isInitialized: isInitialized2 } = useDiagram();

  // Hook pour l'initialisation des feeders (met les ****)
  useDiagramFeeders({ svgRef, metadata: diagramData?.metadata });

  const [outputs, setOutputs] = useAtom(scadaUpdateFeedersAtom);

  const svgContainerRef = useRef<HTMLDivElement>(null);
  const { updateFeeder, updateAllFeeders } = useUpdateFeeders({ svgContainerRef });

  // useSubscribeScadaFeeders({
  //   metadata: diagramData?.metadata,
  //   autoSubscribe: true,
  //   autoUnsubscribeOnUnmount: true,
  //   onDataPoint: (dataPoint: ScadaDataPoint) => {
  //     console.log('bjr: ' + dataPoint);
  //   },
  // });

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
      });
    } else {
      const svg = d3.select(svgRef.current);
      const zoomGroup = ensureZoomGroup(svg);
      updateSvg(diagramData.svg, diagramData.metadata, () => {
        restoreTransform(zoomGroup);
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
  ]);

  useEffect(() => {
    if (isLoaded && metadataRef && metadataRef.current && !isInitialized2) {
      setOutputs({
        metadata: metadataRef.current,
        update: (id, value) => {
          console.log(id, value);
          return updateFeeder(id, value);
        },
      });

      Result.match(outputs, {
        onFailure(error) {
          console.error(JSON.stringify(error));
        },
        onSuccess({ value }) {
          // setScadaOutputs(value);
        },
        onInitial() {},
      });
    }

    return () => {
      // unsubscribe(scadaOutputs);
      // clearInterval(setInterval(() => {}, 1000));
    };
  }, [isLoaded, isInitialized, initializeSvg, svgRef]);

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-hidden bg-background border-0 rounded">
        <EquipmentControls
          targetElement={targetElement}
          onToggleBreaker={toggleBreaker}
          metadata={diagramData?.metadata}
          onGoToVoltageLevel={goto}
        >
          <div ref={svgContainerRef}>
            <svg
              ref={svgRef}
              className="w-full h-full cursor-default"
              style={{ minHeight: '400px' }}
              onContextMenu={handleContextMenuTrigger}
            />
          </div>
        </EquipmentControls>
      </div>
    </div>
  );
};
