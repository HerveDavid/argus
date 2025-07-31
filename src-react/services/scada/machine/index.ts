import { createMachine, assign } from 'xstate';

import { AppMode } from '@/types/mode';

export const modeMachine = createMachine({
  id: 'appMode',
  initial: 'GAME_MASTER',
  context: {
    currentMode: 'GameMaster' as AppMode,
    lastModeChange: new Date(),
    isTransitioning: false,
  },
  states: {
    GAME_MASTER: {
      entry: assign({
        currentMode: 'GameMaster',
        isTransitioning: false,
      }),
      on: {
        SWITCH_TO_SCADA: {
          target: 'TRANSITIONING_TO_SCADA',
        },
      },
    },
    SCADA: {
      entry: assign({
        currentMode: 'Scada',
        isTransitioning: false,
      }),
      on: {
        SWITCH_TO_GAME_MASTER: {
          target: 'TRANSITIONING_TO_GAME_MASTER',
        },
      },
    },
    TRANSITIONING_TO_SCADA: {
      entry: assign({
        isTransitioning: true,
      }),
      after: {
        500: {
          target: 'SCADA',
          actions: assign({
            currentMode: 'Scada',
            lastModeChange: () => new Date(),
            isTransitioning: false,
          }),
        },
      },
    },
    TRANSITIONING_TO_GAME_MASTER: {
      entry: assign({
        isTransitioning: true,
      }),
      after: {
        500: {
          target: 'GAME_MASTER',
          actions: assign({
            currentMode: 'GameMaster',
            lastModeChange: () => new Date(),
            isTransitioning: false,
          }),
        },
      },
    },
  },
});
