import { useMachine } from '@xstate/react';
import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useEffect,
} from 'react';
import { Actor, StateFrom } from 'xstate';

import { modeMachine } from '@/services/scada/machine';
import { AppMode } from '@/types/mode';
import { ModeError } from '@/services/common/mode-client';
import { invoke } from '@tauri-apps/api/core';

type ModeActor = Actor<typeof modeMachine>;
type ModeState = StateFrom<typeof modeMachine>;

interface ModeContextValue {
  actor: ModeActor;
  state: ModeState;
  send: ModeActor['send'];
  // Actions
  switchToScada: () => void;
  switchToGameMaster: () => void;
  switchToKpi: () => void;
  retryModeChange: () => void;
  // Getters
  currentMode: AppMode;
  isTransitioning: boolean;
  lastModeChange: Date;
  error?: ModeError;
  hasError: boolean;
  // Permissions
  canSwitchToScada: boolean;
  canSwitchToGameMaster: boolean;
  canSwitchToKpi: boolean;
}

const ModeContext = createContext<ModeContextValue | null>(null);

interface ModeProviderProps {
  children: ReactNode;
}

export const ModeProvider: React.FC<ModeProviderProps> = ({ children }) => {
  const [state, send, actor] = useMachine(modeMachine);

  useEffect(() => {
    const mountCurrentMode = async () => {
      const { currentMode, isTransitioning } = state.context;

      // Wait for initialization to complete
      if (!state.matches('INITIALIZING') && !isTransitioning && currentMode) {
        console.log('Mounting mode:', currentMode);

        // Invoke ECS mode switch
        await invoke('switch_mode_ecs', { mode: currentMode });
      }
    };

    mountCurrentMode();
  }, [state.matches('INITIALIZING'), state.context.isTransitioning]);

  const contextValue: ModeContextValue = useMemo(
    () => ({
      actor,
      state,
      send,
      // Actions
      switchToScada: () => send({ type: 'SWITCH_TO_SCADA' }),
      switchToGameMaster: () => send({ type: 'SWITCH_TO_GAME_MASTER' }),
      switchToKpi: () => send({ type: 'SWITCH_TO_KPI' }),
      retryModeChange: () => send({ type: 'RETRY_MODE_CHANGE' }),
      // Getters
      currentMode: state.context.currentMode,
      isTransitioning: state.context.isTransitioning,
      lastModeChange: state.context.lastModeChange,
      error: state.context.error,
      hasError: state.matches('ERROR'),
      // Permissions
      canSwitchToScada: state.can({ type: 'SWITCH_TO_SCADA' }),
      canSwitchToGameMaster: state.can({ type: 'SWITCH_TO_GAME_MASTER' }),
      canSwitchToKpi: state.can({ type: 'SWITCH_TO_KPI' }),
    }),
    [state, send, actor],
  );

  return (
    <ModeContext.Provider value={contextValue}>{children}</ModeContext.Provider>
  );
};

// Hooks
export const useMode = (): ModeContextValue => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
};

export const useCurrentMode = (): AppMode => {
  const { currentMode } = useMode();
  return currentMode;
};

export const useIsTransitioning = (): boolean => {
  const { isTransitioning } = useMode();
  return isTransitioning;
};

export const useModeError = () => {
  const { error, hasError, retryModeChange } = useMode();
  return { error, hasError, retryModeChange };
};
