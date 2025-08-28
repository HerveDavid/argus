import { Result } from '@effect-atom/atom-react';
import React, { createContext, useContext } from 'react';
import * as d3 from 'd3';

import { useMetadata } from './metadata.provider';
import {
  parseSvgString,
  validateSvgElement,
  extractViewBox,
} from '../utils/svg-parser';

import {
  useLineGoTo,
  useSvgNavigation,
} from '@/features/single-line-diagram/features/diagram-navigation';
import { useCentralPanelStore } from '@/stores/central-panel.store';

type DiagramContextType = {
  svgRef: React.RefObject<SVGSVGElement>;
  isInitialized: boolean;
};

const DiagramContext = createContext<DiagramContextType | undefined>(undefined);

export const useDiagram = () => {
  const context = useContext(DiagramContext);
  if (!context) {
    throw new Error('useDiagram must be used within DiagramProvider');
  }
  return context;
};

export const DiagramProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Hooks
  const { metadata } = useMetadata();
  const { addPanel } = useCentralPanelStore();

  // States
  const svgRef = React.useRef<SVGSVGElement>(null);
  const isInitializedRef = React.useRef(false);
  const lastSvgStringRef = React.useRef<string>('');
  const [isInitialized, setIsInitialized] = React.useState(false);

  // React callback
  const { setupZoom, cleanup } = useSvgNavigation();

  const ensureZoomGroup = React.useCallback(
    (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
      let zoomGroup = svg.select<SVGGElement>('g.zoom-group');
      if (zoomGroup.empty()) {
        const content = svg.node()?.innerHTML || '';
        svg.node()!.innerHTML = '';
        zoomGroup = svg.append<SVGGElement>('g').attr('class', 'zoom-group');
        zoomGroup.node()!.innerHTML = content;
      }
      return zoomGroup;
    },
    [],
  );

  const initializeSvg = React.useCallback(
    async (svgString: string) => {
      if (!svgRef.current || !svgString?.trim()) return;

      const doc = parseSvgString(svgString);
      if (!doc) return;

      const svgElement = validateSvgElement(doc);
      if (!svgElement) return;

      const svg = d3.select(svgRef.current);

      const viewBox = extractViewBox(svgElement);
      if (viewBox) {
        svg.attr('viewBox', viewBox);
      }

      svg.node()!.innerHTML = svgElement.innerHTML;
      svg.attr('width', '100%').attr('height', '100%');

      ensureZoomGroup(svg);

      lastSvgStringRef.current = svgString;
      isInitializedRef.current = true;
      setIsInitialized(true);
    },
    [svgRef, ensureZoomGroup],
  );

  // Uses
  useLineGoTo({
    svgRef,
    metadata: Result.match(metadata, {
      onInitial: () => undefined,
      onFailure: () => undefined,
      onSuccess: ({ value }) => value.metadata,
    }),
    onGoToVoltageLevel: (id: string) => {
      addPanel({
        id,
        tabComponent: 'default',
        component: 'sld',
        params: { id },
      });
    },
  });

  // React useEffect
  React.useEffect(() => {
    Result.match(metadata, {
      onInitial: () => {},
      onFailure: () => {},
      onSuccess: ({ value }) => {
        initializeSvg(value.svg).then(() => {
          if (!svgRef.current) return;

          const svg = d3.select(svgRef.current);

          setTimeout(() => {
            const zoomGroup = svg.select('g.zoom-group');
            if (!zoomGroup.empty()) {
              setupZoom(svg);
            }
          }, 10);
        });
      },
    });
  }, [metadata, setupZoom, initializeSvg]);

  // React unmount
  React.useEffect(() => {
    return () => {
      if (cleanup) {
        cleanup(svgRef);
      }
    };
  }, [cleanup]);

  // Context
  const store = React.useMemo(
    () => ({
      svgRef,
      isInitialized,
    }),
    [svgRef, isInitialized],
  );

  return (
    <DiagramContext.Provider value={store}>{children}</DiagramContext.Provider>
  );
};
