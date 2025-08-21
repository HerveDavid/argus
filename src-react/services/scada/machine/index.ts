import { createMachine, assign, fromPromise } from 'xstate';
import { Effect } from 'effect';

import { AppMode } from '@/types/mode';
import { ModeClient, ModeError } from '@/services/common/mode-client';
import { runtime } from '@/config/runtime';

// Context typé pour la machine
interface ModeContext {
  currentMode: AppMode;
  lastModeChange: Date;
  isTransitioning: boolean;
  error?: ModeError;
}

// Events typés
type ModeEvents =
  | { type: 'SWITCH_TO_SCADA' }
  | { type: 'SWITCH_TO_GAME_MASTER' }
  | { type: 'SWITCH_TO_KPI' }
  | { type: 'RETRY_MODE_CHANGE' }
  | { type: 'INITIALIZE_MODE' };

// Actor pour changer de mode avec Effect Runtime
const switchModeActor = fromPromise(
  async ({ input }: { input: { targetMode: AppMode } }) => {
    const program = Effect.gen(function* () {
      const client = yield* ModeClient;
      return yield* client.switchMode(input.targetMode);
    });

    return runtime.runPromise(program);
  },
);

// Actor pour initialiser le mode depuis le backend
const initializeModeActor = fromPromise(async () => {
  const program = Effect.gen(function* () {
    const client = yield* ModeClient;
    return yield* client.getCurrentMode();
  });

  return runtime.runPromise(program);
});

// Machine XState avec intégration Effect
export const modeMachine = createMachine({
  id: 'appMode',
  types: {
    context: {} as ModeContext,
    events: {} as ModeEvents,
  },
  initial: 'INITIALIZING',
  context: {
    currentMode: 'GameMaster' as AppMode,
    lastModeChange: new Date(),
    isTransitioning: false,
  },
  states: {
    INITIALIZING: {
      invoke: {
        src: initializeModeActor,
        onDone: [
          {
            target: 'GAME_MASTER',
            guard: ({ event }) => event.output === 'GameMaster',
            actions: assign({
              currentMode: () => 'GameMaster' as AppMode,
              isTransitioning: false,
            }),
          },
          {
            target: 'SCADA',
            guard: ({ event }) => event.output === 'Scada',
            actions: assign({
              currentMode: () => 'Scada' as AppMode,
              isTransitioning: false,
            }),
          },
          {
            target: 'KPI',
            guard: ({ event }) => event.output === 'Kpi',
            actions: assign({
              currentMode: () => 'Kpi' as AppMode,
              isTransitioning: false,
            }),
          },
        ],
        onError: {
          // Fallback au mode par défaut en cas d'erreur d'initialisation
          target: 'GAME_MASTER',
          actions: assign({
            currentMode: 'GameMaster',
            isTransitioning: false,
            error: ({ event }) => event.error as ModeError,
          }),
        },
      },
    },

    GAME_MASTER: {
      entry: assign({
        currentMode: 'GameMaster',
        isTransitioning: false,
        error: undefined,
      }),
      on: {
        SWITCH_TO_SCADA: 'TRANSITIONING_TO_SCADA',
        SWITCH_TO_KPI: 'TRANSITIONING_TO_KPI',
      },
    },

    SCADA: {
      entry: assign({
        currentMode: 'Scada',
        isTransitioning: false,
        error: undefined,
      }),
      on: {
        SWITCH_TO_GAME_MASTER: 'TRANSITIONING_TO_GAME_MASTER',
        SWITCH_TO_KPI: 'TRANSITIONING_TO_KPI',
      },
    },

    KPI: {
      entry: assign({
        currentMode: 'Kpi',
        isTransitioning: false,
        error: undefined,
      }),
      on: {
        SWITCH_TO_SCADA: 'TRANSITIONING_TO_SCADA',
        SWITCH_TO_GAME_MASTER: 'TRANSITIONING_TO_GAME_MASTER',
      },
    },

    TRANSITIONING_TO_SCADA: {
      entry: assign({ isTransitioning: true }),
      invoke: {
        src: switchModeActor,
        input: { targetMode: 'Scada' as AppMode },
        onDone: {
          target: 'SCADA',
          actions: assign({
            currentMode: 'Scada',
            lastModeChange: () => new Date(),
            isTransitioning: false,
            error: undefined,
          }),
        },
        onError: {
          target: 'ERROR',
          actions: assign({
            isTransitioning: false,
            error: ({ event }) => event.error as ModeError,
          }),
        },
      },
    },

    TRANSITIONING_TO_GAME_MASTER: {
      entry: assign({ isTransitioning: true }),
      invoke: {
        src: switchModeActor,
        input: { targetMode: 'GameMaster' as AppMode },
        onDone: {
          target: 'GAME_MASTER',
          actions: assign({
            currentMode: 'GameMaster',
            lastModeChange: () => new Date(),
            isTransitioning: false,
            error: undefined,
          }),
        },
        onError: {
          target: 'ERROR',
          actions: assign({
            isTransitioning: false,
            error: ({ event }) => event.error as ModeError,
          }),
        },
      },
    },

    TRANSITIONING_TO_KPI: {
      entry: assign({ isTransitioning: true }),
      invoke: {
        src: switchModeActor,
        input: { targetMode: 'Kpi' as AppMode },
        onDone: {
          target: 'KPI',
          actions: assign({
            currentMode: 'Kpi',
            lastModeChange: () => new Date(),
            isTransitioning: false,
            error: undefined,
          }),
        },
        onError: {
          target: 'ERROR',
          actions: assign({
            isTransitioning: false,
            error: ({ event }) => event.error as ModeError,
          }),
        },
      },
    },

    ERROR: {
      entry: assign({ isTransitioning: false }),
      on: {
        RETRY_MODE_CHANGE: [
          {
            target: 'TRANSITIONING_TO_SCADA',
            guard: ({ context }) => !!context.error?.message.includes('Scada'),
          },
          {
            target: 'TRANSITIONING_TO_GAME_MASTER',
            guard: ({ context }) =>
              !!context.error?.message.includes('GameMaster'),
          },
          {
            target: 'TRANSITIONING_TO_KPI',
            guard: ({ context }) => !!context.error?.message.includes('Kpi'),
          },
        ],
        SWITCH_TO_SCADA: 'TRANSITIONING_TO_SCADA',
        SWITCH_TO_GAME_MASTER: 'TRANSITIONING_TO_GAME_MASTER',
        SWITCH_TO_KPI: 'TRANSITIONING_TO_KPI',
      },
    },
  },
});
