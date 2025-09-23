import { invoke } from '@tauri-apps/api/core';
import { Effect } from 'effect';

import {
  GameMasterError,
  GameMasterHttpError,
  GameMasterValidationError,
} from './error';
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
} from './types';

interface GameMasterService {
  readonly setGameMasterUrl: (
    url: string,
  ) => Effect.Effect<{ url: string; message: string }, GameMasterError>;

  readonly getGameMasterUrl: () => Effect.Effect<
    { url: string; is_default: boolean },
    GameMasterError
  >;

  readonly initScenario: (
    request: InitScenarioRequest,
  ) => Effect.Effect<SimulationConfig, GameMasterError>;

  readonly trainerUpdateSystemState: (
    request: TrainerUpdateSystemStateRequest,
  ) => Effect.Effect<Record<string, any>, GameMasterError>;

  readonly trainerGetCurrentState: (
    request: TrainerGetCurrentStateRequest,
  ) => Effect.Effect<Record<string, any>, GameMasterError>;

  readonly getDslFile: (
    request: GetDslFileRequest,
  ) => Effect.Effect<string, GameMasterError>;

  readonly simulatorControl: (
    request: SimulatorControlRequest,
  ) => Effect.Effect<AggregateOutput, GameMasterError>;

  readonly simUpdateSystemState: (
    request: SimUpdateSystemStateRequest,
  ) => Effect.Effect<Record<string, any>, GameMasterError>;

  readonly simulatorControlV2: (
    request: SimulatorControlV2Request,
  ) => Effect.Effect<Record<string, any>, GameMasterError>;

  readonly userControl: (
    request: UserControlRequest,
  ) => Effect.Effect<Record<string, any>, GameMasterError>;

  readonly dslControl: (
    request: DslControlRequest,
  ) => Effect.Effect<Record<string, any>, GameMasterError>;

  readonly clusterControl: (
    request: ClusterControlRequest,
  ) => Effect.Effect<Record<string, any>, GameMasterError>;

  readonly userGetCurrentState: () => Effect.Effect<
    Record<string, any>,
    GameMasterError
  >;

  readonly getPendingControls: () => Effect.Effect<
    Record<string, any>,
    GameMasterError
  >;

  readonly uploadIidmFile: (
    request: UploadIidmFileRequest,
  ) => Effect.Effect<Record<string, any>, GameMasterError>;

  readonly getIidmProperties: (
    request: GetIidmPropertiesRequest,
  ) => Effect.Effect<Record<string, any>, GameMasterError>;

  readonly listEvents: (
    request: ListEventsRequest,
  ) => Effect.Effect<Record<string, any>, GameMasterError>;

  readonly getQueueSummary: () => Effect.Effect<
    Record<string, any>,
    GameMasterError
  >;

  // Nouvelles méthodes
  readonly listSavedSimulations: () => Effect.Effect<
    Record<string, any>,
    GameMasterError
  >;

  readonly listSavedIidm: () => Effect.Effect<
    Record<string, any>,
    GameMasterError
  >;

  readonly updateDsl: (
    request: UpdateDslRequest,
  ) => Effect.Effect<Record<string, any>, GameMasterError>;

  readonly deleteDsl: (
    request: DeleteDslRequest,
  ) => Effect.Effect<Record<string, any>, GameMasterError>;

  readonly userStatus: () => Effect.Effect<
    Record<string, any>,
    GameMasterError
  >;

  readonly enqueueNextStepDsl: (
    request: EnqueueNextStepDslRequest,
  ) => Effect.Effect<Record<string, any>, GameMasterError>;
}

// Helper pour parser les erreurs Tauri
const parseError = (error: unknown): GameMasterError => {
  if (error instanceof Error) {
    const message = error.message;

    // Détection des erreurs HTTP basée sur le format du message
    const httpErrorMatch = message.match(/HTTP error (\d+): (.+)/);
    if (httpErrorMatch) {
      const status = parseInt(httpErrorMatch[1]);
      const errorMessage = httpErrorMatch[2];

      if (status === 422) {
        return new GameMasterValidationError({
          message: errorMessage,
          status,
        });
      }

      return new GameMasterHttpError({
        message: errorMessage,
        status,
      });
    }

    // Détection des erreurs spécifiques
    if (message.includes('not found')) {
      return new GameMasterError({
        message,
        code: 'NOT_FOUND',
      });
    }

    if (message.includes('already exists')) {
      return new GameMasterError({
        message,
        code: 'ALREADY_EXISTS',
      });
    }

    if (message.includes('Lock acquisition failed')) {
      return new GameMasterError({
        message,
        code: 'LOCK_ERROR',
      });
    }

    return new GameMasterError({
      message,
      code: 'UNKNOWN',
    });
  }

  return new GameMasterError({
    message: String(error),
    code: 'UNKNOWN',
  });
};

export class GameMasterClient extends Effect.Service<GameMasterClient>()(
  '@/common/GameMasterClient',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      return {
        setGameMasterUrl: (
          url: string,
        ): Effect.Effect<{ url: string; message: string }, GameMasterError> =>
          Effect.tryPromise({
            try: () =>
              invoke<{ url: string; message: string }>('set_gamemaster_url', {
                url,
              }),
            catch: parseError,
          }),

        getGameMasterUrl: (): Effect.Effect<
          { url: string; is_default: boolean },
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<{ url: string; is_default: boolean }>(
                'get_gamemaster_url',
              ),
            catch: parseError,
          }),

        initScenario: ({
          dsl_file_content,
          simulation_name,
          artifact_id,
        }: InitScenarioRequest): Effect.Effect<
          SimulationConfig,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<SimulationConfig>('init_game_master_scenario', {
                dsl_file_content,
                simulation_name,
                artifact_id,
              }),
            catch: parseError,
          }),

        trainerUpdateSystemState: ({
          current_time,
          state,
        }: TrainerUpdateSystemStateRequest): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<Record<string, any>>(
                'trainer_update_system_state_command',
                {
                  current_time,
                  state,
                },
              ),
            catch: parseError,
          }),

        trainerGetCurrentState: ({
          start_time,
          end_time,
        }: TrainerGetCurrentStateRequest): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<Record<string, any>>('trainer_get_current_state_command', {
                start_time,
                end_time,
              }),
            catch: parseError,
          }),

        getDslFile: ({
          simulation_name,
        }: GetDslFileRequest): Effect.Effect<string, GameMasterError> =>
          Effect.tryPromise({
            try: () =>
              invoke<string>('get_dsl_file_command', {
                simulation_name,
              }),
            catch: parseError,
          }),

        simulatorControl: ({
          current_time,
        }: SimulatorControlRequest): Effect.Effect<
          AggregateOutput,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<AggregateOutput>('simulator_control_command', {
                current_time,
              }),
            catch: parseError,
          }),

        simUpdateSystemState: ({
          current_time,
          state,
        }: SimUpdateSystemStateRequest): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<Record<string, any>>('sim_update_system_state_command', {
                current_time,
                state,
              }),
            catch: parseError,
          }),

        simulatorControlV2: ({
          current_time,
        }: SimulatorControlV2Request): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<Record<string, any>>('simulator_control_v2_command', {
                current_time,
              }),
            catch: parseError,
          }),

        userControl: ({
          control_type,
          action,
          id,
          timestamp,
          value,
          interval_start,
          interval_end,
          law,
          metadata,
        }: UserControlRequest): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<Record<string, any>>('user_control_command', {
                control_type,
                action,
                id,
                timestamp,
                value,
                interval_start,
                interval_end,
                law,
                metadata,
              }),
            catch: parseError,
          }),

        dslControl: ({
          control,
        }: DslControlRequest): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<Record<string, any>>('dsl_control_command', {
                control,
              }),
            catch: parseError,
          }),

        clusterControl: ({
          control_type,
          action,
          target,
          timestamp,
          value,
          interval_start,
          interval_end,
          law,
          metadata,
        }: ClusterControlRequest): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<Record<string, any>>('cluster_control_command', {
                control_type,
                action,
                target,
                timestamp,
                value,
                interval_start,
                interval_end,
                law,
                metadata,
              }),
            catch: parseError,
          }),

        userGetCurrentState: (): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<Record<string, any>>('user_get_current_state_command'),
            catch: parseError,
          }),

        getPendingControls: (): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<Record<string, any>>('get_pending_controls_command'),
            catch: parseError,
          }),

        uploadIidmFile: ({
          file_content,
          file_name,
          artifact_id,
        }: UploadIidmFileRequest): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<Record<string, any>>('upload_iidm_file_command', {
                file_content,
                file_name,
                artifact_id,
              }),
            catch: parseError,
          }),

        getIidmProperties: ({
          file_id,
        }: GetIidmPropertiesRequest): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<Record<string, any>>('get_iidm_properties_command', {
                file_id,
              }),
            catch: parseError,
          }),

        listEvents: ({
          status,
          source,
          time_spec,
          simulation,
          limit,
          offset,
        }: ListEventsRequest): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<Record<string, any>>('list_events_command', {
                status,
                source,
                time_spec,
                simulation,
                limit,
                offset,
              }),
            catch: parseError,
          }),

        getQueueSummary: (): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () => invoke<Record<string, any>>('get_queue_summary_command'),
            catch: parseError,
          }),

        // NOUVELLES MÉTHODES
        listSavedSimulations: (): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<Record<string, any>>('list_saved_simulations_command'),
            catch: parseError,
          }),

        listSavedIidm: (): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () => invoke<Record<string, any>>('list_saved_iidm_command'),
            catch: parseError,
          }),

        updateDsl: ({
          simulation_name,
          dsl_file_content,
        }: UpdateDslRequest): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<Record<string, any>>('update_dsl_command', {
                simulation_name,
                dsl_file_content,
              }),
            catch: parseError,
          }),

        deleteDsl: ({
          simulation_name,
        }: DeleteDslRequest): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<Record<string, any>>('delete_dsl_command', {
                simulation_name,
              }),
            catch: parseError,
          }),

        userStatus: (): Effect.Effect<Record<string, any>, GameMasterError> =>
          Effect.tryPromise({
            try: () => invoke<Record<string, any>>('user_status_command'),
            catch: parseError,
          }),

        enqueueNextStepDsl: ({
          dsl,
        }: EnqueueNextStepDslRequest): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<Record<string, any>>('enqueue_next_step_dsl_command', {
                dsl,
              }),
            catch: parseError,
          }),
      } satisfies GameMasterService;
    }),
  },
) {}
