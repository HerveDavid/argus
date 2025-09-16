import {
  GameMasterClient,
  InitScenarioRequest,
  SimulatorControlRequest,
  UserControlRequest,
} from '@/services/common/game-master-client2';
import { Atom } from '@effect-atom/atom-react';
import { Effect, Layer } from 'effect';

const runtimeAtom = Atom.runtime(Layer.mergeAll(GameMasterClient.Default));

export const loadDslAtom = runtimeAtom.fn(
  Effect.fn(function* (initRequest: InitScenarioRequest) {
    const gameMasterClient = yield* GameMasterClient;

    return yield* gameMasterClient.initScenario(initRequest);
  }),
);

// Atom pour obtenir l'état courant
export const currentStateAtom = runtimeAtom.atom(
  Effect.gen(function* () {
    const gameMasterClient = yield* GameMasterClient;
    return yield* gameMasterClient.userGetCurrentState();
  }),
);

// Atom pour les contrôles utilisateur
export const userControlAtom = runtimeAtom.fn(
  Effect.fn(function* (controlRequest: UserControlRequest) {
    const gameMasterClient = yield* GameMasterClient;
    return yield* gameMasterClient.userControl(controlRequest);
  }),
);

// Atom pour le contrôle du simulateur
export const simulatorControlAtom = runtimeAtom.fn(
  Effect.fn(function* (request: SimulatorControlRequest) {
    const gameMasterClient = yield* GameMasterClient;
    return yield* gameMasterClient.simulatorControl(request);
  }),
);

// Atom pour la liste des événements avec paramètres
export const eventsAtom = Atom.family(
  (params: { status?: string; source?: string; limit?: number }) =>
    runtimeAtom.atom(
      Effect.gen(function* () {
        const gameMasterClient = yield* GameMasterClient;
        return yield* gameMasterClient.listEvents({
          status: params.status,
          source: params.source,
          time_spec: undefined,
          simulation: undefined,
          limit: params.limit,
          offset: undefined,
        });
      }),
    ),
);

// Atom pour les contrôles en attente (avec auto-refresh)
export const pendingControlsAtom = runtimeAtom
  .atom(
    Effect.gen(function* () {
      const gameMasterClient = yield* GameMasterClient;
      return yield* gameMasterClient.getPendingControls();
    }),
  )
  .pipe(
    Atom.keepAlive, // Garde l'atom vivant pour maintenir l'état
  );
