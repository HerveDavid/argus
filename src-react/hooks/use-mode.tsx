import { useMachine } from '@xstate/react';
import React, { createContext, useContext, ReactNode } from 'react';
import { Actor, StateFrom } from 'xstate';

import { modeMachine } from '@/services/scada/machine';
import { AppMode } from '@/types/mode';

// Types pour le contexte
type ModeActor = Actor<typeof modeMachine>;
type ModeState = StateFrom<typeof modeMachine>;

interface ModeContextValue {
  // Actor XState
  actor: ModeActor;
  // État actuel
  state: ModeState;
  // Fonction send
  send: ModeActor['send'];
  // Actions disponibles
  switchToScada: () => void;
  switchToGameMaster: () => void;
  // Getters utiles
  currentMode: AppMode;
  isTransitioning: boolean;
  lastModeChange: Date;
  canSwitchToScada: boolean;
  canSwitchToGameMaster: boolean;
}

// Création du contexte
const ModeContext = createContext<ModeContextValue | null>(null);

// Props du provider
interface ModeProviderProps {
  children: ReactNode;
}

// Provider component
export const ModeProvider: React.FC<ModeProviderProps> = ({ children }) => {
  const [state, send, actor] = useMachine(modeMachine, {
    // Options vides pour satisfaire le type, ajustez selon vos besoins
  });

  // Actions
  const switchToScada = () => {
    send({ type: 'SWITCH_TO_SCADA' });
  };

  const switchToGameMaster = () => {
    send({ type: 'SWITCH_TO_GAME_MASTER' });
  };

  // Getters utiles
  const currentMode = state.context.currentMode;
  const isTransitioning = state.context.isTransitioning;
  const lastModeChange = state.context.lastModeChange;
  const canSwitchToScada = state.can({ type: 'SWITCH_TO_SCADA' });
  const canSwitchToGameMaster = state.can({ type: 'SWITCH_TO_GAME_MASTER' });

  const contextValue: ModeContextValue = {
    actor,
    state,
    send,
    switchToScada,
    switchToGameMaster,
    currentMode,
    isTransitioning,
    lastModeChange,
    canSwitchToScada,
    canSwitchToGameMaster,
  };

  return (
    <ModeContext.Provider value={contextValue}>{children}</ModeContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useMode = (): ModeContextValue => {
  const context = useContext(ModeContext);

  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }

  return context;
};

// Hook pour accéder uniquement au mode actuel (optimisation re-render)
export const useCurrentMode = (): AppMode => {
  const { currentMode } = useMode();
  return currentMode;
};

// Hook pour accéder uniquement au statut de transition
export const useIsTransitioning = (): boolean => {
  const { isTransitioning } = useMode();
  return isTransitioning;
};

// Composant HOC optionnel pour wrapper facilement des composants
export const withModeProvider = <P extends object>(
  Component: React.ComponentType<P>,
): React.FC<P> => {
  return (props: P) => (
    <ModeProvider>
      <Component {...props} />
    </ModeProvider>
  );
};
