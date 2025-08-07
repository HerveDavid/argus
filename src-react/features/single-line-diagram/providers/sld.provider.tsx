import React, { createContext, ReactNode, useContext, useRef } from 'react';
import { useDiagramReloader } from '../features/diagram-reloader';

type SldContextType = ReturnType<typeof useDiagramReloader> & {
  currentId: string;
  svgRef: React.RefObject<SVGSVGElement>;
};
const SldContext = createContext<SldContextType | null>(null);

export const useSldContext = () => {
  const context = useContext(SldContext);
  if (!context) {
    throw new Error('useSldContext must be used within SldProvider');
  }
  return context;
};

interface SldProviderProps {
  children: ReactNode;
  id: string;
}

export const SldProvider: React.FC<SldProviderProps> = ({ children, id }) => {
  const storeReloader = useDiagramReloader({
    id,
    autoLoad: true,
  });

  const svgRef = useRef<SVGSVGElement>(null);

  const store = {
    ...storeReloader,
    currentId: id,
    svgRef,
  };

  return <SldContext.Provider value={store}>{children}</SldContext.Provider>;
};
