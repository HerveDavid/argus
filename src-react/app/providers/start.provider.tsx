import React from 'react';
import * as Effect from 'effect/Effect';
import { ProjectClient } from '@/services/common/project-client';
import { useRuntime } from '@/services/runtime/use-runtime';

type StartState =
  | { status: 'idle' }
  | { status: 'starting' }
  | { status: 'started' }
  | { status: 'stopping' }
  | { status: 'error'; error: unknown };

interface StartContextValue {
  state: StartState;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  isStarted: boolean;
  isLoading: boolean;
  error: unknown | null;
}

const StartContext = React.createContext<StartContextValue | null>(null);

const StartService = {
  start: Effect.gen(function* () {
    const projectClient = yield* ProjectClient;
    const project = yield* projectClient.loadProject();
    yield* Effect.logInfo('Project loaded successfully', { project });

    yield* Effect.logInfo('Application started successfully');
    return true;
  }),

  stop: Effect.gen(function* () {
    yield* Effect.logInfo('Application stopped successfully');
    return true;
  }),
};

export const StartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const runtime = useRuntime();
  const [state, setState] = React.useState<StartState>({ status: 'idle' });

  const operationRef = React.useRef<AbortController | null>(null);
  const start = React.useCallback(async () => {
    if (!runtime) {
      setState({ status: 'error', error: new Error('Runtime not available') });
      return;
    }

    if (state.status === 'starting' || state.status === 'started') {
      return;
    }

    // Annuler toute opération en cours
    operationRef.current?.abort();
    operationRef.current = new AbortController();

    setState({ status: 'starting' });

    try {
      await runtime.runPromise(StartService.start);

      if (!operationRef.current.signal.aborted) {
        setState({ status: 'started' });
      }
    } catch (error) {
      if (!operationRef.current.signal.aborted) {
        setState({ status: 'error', error });
      }
    }
  }, [runtime, state.status]);

  const stop = React.useCallback(async () => {
    if (!runtime) {
      setState({ status: 'error', error: new Error('Runtime not available') });
      return;
    }

    if (state.status === 'stopping' || state.status === 'idle') {
      return;
    }

    // Annuler toute opération en cours
    operationRef.current?.abort();
    operationRef.current = new AbortController();

    setState({ status: 'stopping' });

    try {
      await runtime.runPromise(StartService.stop);

      if (!operationRef.current.signal.aborted) {
        setState({ status: 'idle' });
      }
    } catch (error) {
      if (!operationRef.current.signal.aborted) {
        setState({ status: 'error', error });
      }
    }
  }, [runtime, state.status]);

  // Cleanup à la destruction
  React.useEffect(() => {
    return () => {
      operationRef.current?.abort();
    };
  }, []);

  // Auto-start optionnel
  const autoStart = React.useCallback(() => {
    if (runtime && state.status === 'idle') {
      start();
    }
  }, [runtime, state.status, start]);

  // Démarrage automatique quand le runtime est disponible
  React.useEffect(() => {
    autoStart();
  }, [autoStart]);

  const contextValue = React.useMemo(
    (): StartContextValue => ({
      state,
      start,
      stop,
      isStarted: state.status === 'started',
      isLoading: state.status === 'starting' || state.status === 'stopping',
      error: state.status === 'error' ? state.error : null,
    }),
    [state, start, stop],
  );

  return (
    <StartContext.Provider value={contextValue}>
      {children}
    </StartContext.Provider>
  );
};

export const useStart = (): StartContextValue => {
  const context = React.useContext(StartContext);
  if (!context) {
    throw new Error('useStart must be used within a StartProvider');
  }
  return context;
};

// Hook pour un démarrage conditionnel
export const useAutoStart = (condition: boolean = true) => {
  const { start, isStarted, isLoading } = useStart();

  React.useEffect(() => {
    if (condition && !isStarted && !isLoading) {
      start();
    }
  }, [condition, isStarted, isLoading, start]);
};

// Hook pour surveiller les changements d'état
export const useStartEffect = (
  onStart?: () => void,
  onStop?: () => void,
  onError?: (error: unknown) => void,
) => {
  const { state } = useStart();

  React.useEffect(() => {
    switch (state.status) {
      case 'started':
        onStart?.();
        break;
      case 'idle':
        onStop?.();
        break;
      case 'error':
        onError?.(state.error);
        break;
    }
  }, [state, onStart, onStop, onError]);
};

export const StartLoadingGate: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = <div>Starting...</div> }) => {
  const { isStarted, isLoading, error } = useStart();

  if (error) {
    return <div>Error: {String(error)}</div>;
  }

  if (isLoading || !isStarted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
