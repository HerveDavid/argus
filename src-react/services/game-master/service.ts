import { Context, Effect } from 'effect';
import {
  TauriTimeoutError,
  TauriInvokeError,
} from '../common/tauri-layer';
import {
  SimulationConfig,
  AggregateOutput,
  InitScenarioRequest,
  TrainerUpdateSystemStateRequest,
  TrainerGetCurrentStateRequest,
  GetDslFileRequest,
  SimulatorControlRequest,
  SimUpdateSystemStateRequest,
  SimulatorControlV2Request,
  UserControlRequest,
  DslControlRequest,
  ClusterControlRequest,
  UploadIidmFileRequest,
  GetIidmPropertiesRequest,
  ListEventsRequest,
  UpdateDslRequest,
  DeleteDslRequest,
  EnqueueNextStepDslRequest,
  SavedSimulation,
  SavedIidm,
  QueueSummary,
  EventItem,
} from './types';

export interface GameMasterService {
  // Configuration
  readonly setGameMasterUrl: (params: {
    url: string;
  }) => Effect.Effect<
    { url: string; message: string },
    TauriInvokeError | TauriTimeoutError
  >;

  readonly getGameMasterUrl: () => Effect.Effect<
    { url: string; is_default: boolean },
    TauriInvokeError | TauriTimeoutError
  >;

  // Scenario Management
  readonly initScenario: (
    request: InitScenarioRequest,
  ) => Effect.Effect<SimulationConfig, TauriInvokeError | TauriTimeoutError>;

  readonly getDslFile: (
    request: GetDslFileRequest,
  ) => Effect.Effect<string, TauriInvokeError | TauriTimeoutError>;

  readonly updateDsl: (
    request: UpdateDslRequest,
  ) => Effect.Effect<Record<string, any>, TauriInvokeError | TauriTimeoutError>;

  readonly deleteDsl: (
    request: DeleteDslRequest,
  ) => Effect.Effect<Record<string, any>, TauriInvokeError | TauriTimeoutError>;

  readonly enqueueNextStepDsl: (
    request: EnqueueNextStepDslRequest,
  ) => Effect.Effect<Record<string, any>, TauriInvokeError | TauriTimeoutError>;

  // Simulation Control
  readonly simulatorControl: (
    request: SimulatorControlRequest,
  ) => Effect.Effect<AggregateOutput, TauriInvokeError | TauriTimeoutError>;

  readonly simulatorControlV2: (
    request: SimulatorControlV2Request,
  ) => Effect.Effect<Record<string, any>, TauriInvokeError | TauriTimeoutError>;

  // State Management
  readonly trainerUpdateSystemState: (
    request: TrainerUpdateSystemStateRequest,
  ) => Effect.Effect<Record<string, any>, TauriInvokeError | TauriTimeoutError>;

  readonly trainerGetCurrentState: (
    request: TrainerGetCurrentStateRequest,
  ) => Effect.Effect<Record<string, any>, TauriInvokeError | TauriTimeoutError>;

  readonly simUpdateSystemState: (
    request: SimUpdateSystemStateRequest,
  ) => Effect.Effect<Record<string, any>, TauriInvokeError | TauriTimeoutError>;

  readonly userGetCurrentState: () => Effect.Effect<
    Record<string, any>,
    TauriInvokeError | TauriTimeoutError
  >;

  // Control Operations
  readonly userControl: (
    request: UserControlRequest,
  ) => Effect.Effect<Record<string, any>, TauriInvokeError | TauriTimeoutError>;

  readonly dslControl: (
    request: DslControlRequest,
  ) => Effect.Effect<Record<string, any>, TauriInvokeError | TauriTimeoutError>;

  readonly clusterControl: (
    request: ClusterControlRequest,
  ) => Effect.Effect<Record<string, any>, TauriInvokeError | TauriTimeoutError>;

  readonly getPendingControls: () => Effect.Effect<
    Record<string, any>,
    TauriInvokeError | TauriTimeoutError
  >;

  // File Management
  readonly uploadIidmFile: (
    request: UploadIidmFileRequest,
  ) => Effect.Effect<Record<string, any>, TauriInvokeError | TauriTimeoutError>;

  readonly getIidmProperties: (
    request: GetIidmPropertiesRequest,
  ) => Effect.Effect<Record<string, any>, TauriInvokeError | TauriTimeoutError>;

  readonly listSavedSimulations: () => Effect.Effect<
    SavedSimulation[],
    TauriInvokeError | TauriTimeoutError
  >;

  readonly listSavedIidm: () => Effect.Effect<
    SavedIidm[],
    TauriInvokeError | TauriTimeoutError
  >;

  // Events and Queue
  readonly listEvents: (
    request: ListEventsRequest,
  ) => Effect.Effect<EventItem[], TauriInvokeError | TauriTimeoutError>;

  readonly getQueueSummary: () => Effect.Effect<
    QueueSummary,
    TauriInvokeError | TauriTimeoutError
  >;

  // Status
  readonly userStatus: () => Effect.Effect<
    Record<string, any>,
    TauriInvokeError | TauriTimeoutError
  >;
}

export const GameMasterService = Context.GenericTag<GameMasterService>(
  '@/GameMasterService',
);
