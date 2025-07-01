import { useEffect } from 'react';
import * as d3 from 'd3';
import { SVGContextMenu } from './svg-context-menu';
import { useSldContext } from '../providers/sld.provider';
import { useSvgZoom } from '../features/diagram-visualization/hooks/use-svg-zoom';
import { useSvgManager } from '../features/diagram-visualization/hooks/use-svg-manager';
import { useBreakerToggle } from '../features/diagram-visualization/hooks/use-breaker-toogle';
import { useContextMenu } from '../features/diagram-visualization/hooks/use-context-menu';

export const DiagramContent = () => {
  const { svgRef, diagramData } = useSldContext();

  const { setupZoom, restoreTransform, cleanup } = useSvgZoom();
  const { isInitialized, initializeSvg, updateSvg, ensureZoomGroup } =
    useSvgManager(svgRef);
  const { toggleBreaker } = useBreakerToggle(svgRef);
  const { targetElement, handleContextMenuTrigger } = useContextMenu();

  // Gestion des mises à jour SVG
  useEffect(() => {
    if (!diagramData?.svg || !svgRef.current) return;

    if (!isInitialized) {
      initializeSvg(diagramData.svg).then(() => {
        // Setup du zoom après l'initialisation
        const svg = d3.select(svgRef.current!);
        setupZoom(svg);
      });
    } else {
      const svg = d3.select(svgRef.current);
      const zoomGroup = ensureZoomGroup(svg);

      updateSvg(diagramData.svg, diagramData.metadata, () =>
        restoreTransform(zoomGroup),
      );
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

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-hidden bg-background border-0 rounded">
        <SVGContextMenu
          targetElement={targetElement}
          onToggleBreaker={toggleBreaker}
        >
          <svg
            ref={svgRef}
            className="w-full h-full cursor-default"
            style={{ minHeight: '400px' }}
            onContextMenu={handleContextMenuTrigger}
          />
        </SVGContextMenu>
      </div>
    </div>
  );
};
