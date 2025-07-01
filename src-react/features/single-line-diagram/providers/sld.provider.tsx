import React, { createContext, ReactNode, useContext } from 'react';
import { useDiagramReloader } from '../features/diagram-reloader';

type SldContextType = ReturnType<typeof useDiagramReloader>;
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
  // Le hook gère maintenant toute la logique d'initialisation et de changement d'ID
  const storeReloader = useDiagramReloader({
    id,
    autoLoad: true,
  });

  const store = {
    ...storeReloader,
    currentId: id,
  };

  return <SldContext.Provider value={store}>{children}</SldContext.Provider>;
};
