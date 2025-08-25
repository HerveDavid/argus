import { Result, useAtom } from '@effect-atom/atom-react';
import React, { createContext, useContext, useRef, useState } from 'react';
import {
  diagramAtom,
  outputsAtom,
  scadaFeedersAtom,
  scadaRemoveFeedersAtom,
  scadaUpdateFeedersAtom,
} from './atoms';
import { SldMetadata } from '@/types/sld-metadata';
import { useSvgManager } from '../../features/diagram-visualization';
import { ScadaOutput } from '@/services/common/scada-client';
import { useUpdateFeeders } from '../../features/diagram-feeders';

type DiagramContextType = {
  elementId: string;
  svgRef: React.MutableRefObject<SVGSVGElement | null>;
  metadataRef: React.MutableRefObject<SldMetadata | null>;
  isLoaded: boolean;
  isInitialized: boolean;
  scadaOutputs: ScadaOutput[];
  initializeSvg: (svgString: string) => Promise<void>;
  updateSvg: (
    newSvgString: string,
    metadata?: SldMetadata,
    restoreTransformFn?: () => void,
  ) => void;
  ensureZoomGroup: (svg: any) => any;
  svgContent: string | null;
};

const DiagramContext = createContext<DiagramContextType | undefined>(undefined);

export const useDiagram = () => {
  const context = useContext(DiagramContext);
  if (!context) {
    throw new Error('useDiagram must be used within DiagramProvider');
  }
  return context;
};

interface DiagramProviderProps {
  children: React.ReactNode;
  elementId: string;
}

export const DiagramProvider: React.FC<DiagramProviderProps> = ({
  children,
  elementId,
}) => {
  const [diagram, setDiagram] = useAtom(diagramAtom);
  // const [outputs, setOutputs] = useAtom(outputsAtom);
  // const [outputs, setOutputs] = useAtom(scadaFeedersAtom);
  const [outputs, setOutputs] = useAtom(scadaUpdateFeedersAtom);
  const [_, unsubscribe] = useAtom(scadaRemoveFeedersAtom);

  const [isLoaded, setIsLoaded] = useState(false);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [scadaOutputs, setScadaOutputs] = useState<ScadaOutput[]>([]);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const metadataRef = useRef<SldMetadata | null>(null);

  const { isInitialized, initializeSvg, updateSvg, ensureZoomGroup } =
    useSvgManager(svgRef);

  // const svgContainerRef = useRef<HTMLDivElement>(null);
  // const { updateFeeder } = useUpdateFeeders({ svgContainerRef });

  const store = React.useMemo(
    () => ({
      elementId,
      svgRef,
      metadataRef,
      isLoaded,
      isInitialized,
      initializeSvg,
      updateSvg,
      ensureZoomGroup,
      svgContent,
      scadaOutputs,
    }),
    [
      elementId,
      isLoaded,
      isInitialized,
      initializeSvg,
      updateSvg,
      ensureZoomGroup,
      svgContent,
      scadaOutputs,
    ],
  );

  React.useEffect(() => {
    setDiagram(elementId);
  }, [elementId, setDiagram]);

  React.useEffect(() => {
    Result.match(diagram, {
      onSuccess({ value }) {
        metadataRef.current = value.metadata as SldMetadata | null;

        if (typeof value.svg_content === 'string') {
          setSvgContent(value.svg_content);
        } else {
          const element = value.svg_content as SVGSVGElement | null;
          if (element && element.outerHTML) {
            setSvgContent(element.outerHTML);
          }
        }

        setIsLoaded(true);
      },
      onFailure: () => {
        metadataRef.current = null;
        setSvgContent(null);
        setIsLoaded(false);
      },
      onInitial: () => {
        metadataRef.current = null;
        setSvgContent(null);
        setIsLoaded(false);
      },
    });
  }, [diagram]);

  React.useEffect(() => {
    if (isLoaded && svgContent && svgRef.current && !isInitialized) {
      initializeSvg(svgContent);
    }
  }, [isLoaded, isInitialized, initializeSvg, svgContent]);

  // React.useEffect(() => {
  //   if (isLoaded && metadataRef && metadataRef.current && !isInitialized) {
  //     setOutputs({
  //       metadata: metadataRef.current,
  //       update: updateFeeder,
  //     });

  //     Result.match(outputs, {
  //       onFailure(error) {
  //         console.error(JSON.stringify(error));
  //       },
  //       onSuccess({ value }) {
  //         setScadaOutputs(value);
  //       },
  //       onInitial() {},
  //     });
  //   }

  //   return () => {
  //     unsubscribe(scadaOutputs);
  //     clearInterval(setInterval(() => {}, 1000));
  //   };
  // }, [isLoaded, isInitialized, initializeSvg, svgContent]);

  return (
    <DiagramContext.Provider value={store}>
      {Result.match(diagram, {
        onFailure: (err) => <div>Error: {JSON.stringify(err)}</div>,
        onInitial: () => <div>Loading diagram...</div>,
        onSuccess: () => children,
      })}
    </DiagramContext.Provider>
  );
};
