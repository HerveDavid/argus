import { invoke } from '@tauri-apps/api/core';
import { Effect } from 'effect';

import { GameMasterError } from './error';
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
} from './types';

interface GameMasterService {
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
}

export class GameMasterClient extends Effect.Service<GameMasterClient>()(
  '@/common/GameMasterClient',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      return {
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
            catch: (error) =>
              new GameMasterError({
                message: error instanceof Error ? error.message : String(error),
              }),
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
            catch: (error) =>
              new GameMasterError({
                message: error instanceof Error ? error.message : String(error),
              }),
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
            catch: (error) =>
              new GameMasterError({
                message: error instanceof Error ? error.message : String(error),
              }),
          }),

        getDslFile: ({
          simulation_name,
        }: GetDslFileRequest): Effect.Effect<string, GameMasterError> =>
          Effect.tryPromise({
            try: () =>
              invoke<string>('get_dsl_file_command', {
                simulation_name,
              }),
            catch: (error) =>
              new GameMasterError({
                message: error instanceof Error ? error.message : String(error),
              }),
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
            catch: (error) =>
              new GameMasterError({
                message: error instanceof Error ? error.message : String(error),
              }),
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
            catch: (error) =>
              new GameMasterError({
                message: error instanceof Error ? error.message : String(error),
              }),
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
            catch: (error) =>
              new GameMasterError({
                message: error instanceof Error ? error.message : String(error),
              }),
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
            catch: (error) =>
              new GameMasterError({
                message: error instanceof Error ? error.message : String(error),
              }),
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
            catch: (error) =>
              new GameMasterError({
                message: error instanceof Error ? error.message : String(error),
              }),
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
            catch: (error) =>
              new GameMasterError({
                message: error instanceof Error ? error.message : String(error),
              }),
          }),

        userGetCurrentState: (): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<Record<string, any>>('user_get_current_state_command'),
            catch: (error) =>
              new GameMasterError({
                message: error instanceof Error ? error.message : String(error),
              }),
          }),

        getPendingControls: (): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () =>
              invoke<Record<string, any>>('get_pending_controls_command'),
            catch: (error) =>
              new GameMasterError({
                message: error instanceof Error ? error.message : String(error),
              }),
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
            catch: (error) =>
              new GameMasterError({
                message: error instanceof Error ? error.message : String(error),
              }),
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
            catch: (error) =>
              new GameMasterError({
                message: error instanceof Error ? error.message : String(error),
              }),
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
            catch: (error) =>
              new GameMasterError({
                message: error instanceof Error ? error.message : String(error),
              }),
          }),

        getQueueSummary: (): Effect.Effect<
          Record<string, any>,
          GameMasterError
        > =>
          Effect.tryPromise({
            try: () => invoke<Record<string, any>>('get_queue_summary_command'),
            catch: (error) =>
              new GameMasterError({
                message: error instanceof Error ? error.message : String(error),
              }),
          }),
      } satisfies GameMasterService;
    }),
  },
) {}
