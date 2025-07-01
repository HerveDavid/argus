import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { SldStore } from '../types';
import { useDiagramReloader } from '../features/diagram-reloader';

const SldContext = createContext<
  | (Omit<SldStore, 'runtime' | 'setRuntime'> & {
      isReady: boolean;
      currentId: string;
    })
  | null
>(null);

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
  const previousIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);
  const store = useDiagramReloader();

  // Gestion de l'initialisation et du changement d'ID
  useEffect(() => {
    const isIdChanged = previousIdRef.current !== id;
    const isReady = store.isReady;
    const shouldLoad =
      id && isReady && (isIdChanged || !hasInitializedRef.current);

    if (shouldLoad) {
      // Nettoyer le diagramme précédent si l'ID a changé
      if (isIdChanged && previousIdRef.current !== null) {
        store.clearDiagram();
      }

      // Charger le nouveau diagramme
      store.loadDiagram(id);

      // Marquer comme initialisé et sauvegarder l'ID actuel
      hasInitializedRef.current = true;
      previousIdRef.current = id;
    }
  }, [id, store.isReady, store.loadDiagram, store.clearDiagram]);

  // Réinitialiser les refs si l'ID change
  useEffect(() => {
    if (previousIdRef.current !== null && previousIdRef.current !== id) {
      hasInitializedRef.current = false;
    }
  }, [id]);

  // Ajouter l'ID actuel au store pour que les composants enfants puissent y accéder
  const enhancedStore = {
    ...store,
    currentId: id,
  };

  return (
    <SldContext.Provider value={enhancedStore}>{children}</SldContext.Provider>
  );
};
