import { Effect, Layer } from 'effect';
import { TauriService } from '../common/tauri-layer';
import {
  SimulationConfig,
  AggregateOutput,
  SavedSimulation,
  SavedIidm,
  QueueSummary,
  EventItem,
} from './types';
import { GameMasterService } from './service';

export const GameMasterServiceLive = Layer.effect(
  GameMasterService,
  Effect.gen(function* () {
    const tauri = yield* TauriService;

    return GameMasterService.of({
      // Configuration - with toast
      setGameMasterUrl: ({ url }) =>
        tauri.invoke<{ url: string; message: string }>('set_gamemaster_url', {
          url,
        }),

      getGameMasterUrl: () =>
        tauri.invoke<{ url: string; is_default: boolean }>(
          'get_gamemaster_url',
        ),

      // Scenario Management - with toast for mutations
      initScenario: (request) =>
        tauri.invoke<SimulationConfig>('init_game_master_scenario', {
          dsl_file_content: request.dsl_file_content,
          simulation_name: request.simulation_name,
          artifact_id: request.artifact_id,
        }),

      getDslFile: ({ simulation_name }) =>
        tauri.invoke<string>('get_dsl_file_command', { simulation_name }),

      updateDsl: (request) =>
        tauri.invoke<Record<string, any>>('update_dsl_command', {
          simulation_name: request.simulation_name,
          dsl_file_content: request.dsl_file_content,
        }),

      deleteDsl: ({ simulation_name }) =>
        tauri.invoke<Record<string, any>>('delete_dsl_command', {
          simulation_name,
        }),

      enqueueNextStepDsl: ({ dsl }) =>
        tauri.invoke<Record<string, any>>('enqueue_next_step_dsl_command', {
          dsl,
        }),

      // Simulation Control - with toast for control operations
      simulatorControl: ({ current_time }) =>
        tauri.invoke<AggregateOutput>('simulator_control_command', {
          current_time,
        }),

      simulatorControlV2: ({ current_time }) =>
        tauri.invoke<Record<string, any>>('simulator_control_v2_command', {
          current_time,
        }),

      // State Management - silent operations
      trainerUpdateSystemState: (request) =>
        tauri.invoke<Record<string, any>>(
          'trainer_update_system_state_command',
          {
            current_time: request.current_time,
            state: request.state,
          },
        ),

      trainerGetCurrentState: (request) =>
        tauri.invoke<Record<string, any>>('trainer_get_current_state_command', {
          start_time: request.start_time,
          end_time: request.end_time,
        }),

      simUpdateSystemState: (request) =>
        tauri.invoke<Record<string, any>>('sim_update_system_state_command', {
          current_time: request.current_time,
          state: request.state,
        }),

      userGetCurrentState: () =>
        tauri.invoke<Record<string, any>>('user_get_current_state_command'),

      // Control Operations - with toast for user actions
      userControl: (request) =>
        tauri.invoke<Record<string, any>>('user_control_command', {
          control_type: request.control_type,
          action: request.action,
          id: request.id,
          timestamp: request.timestamp,
          value: request.value,
          interval_start: request.interval_start,
          interval_end: request.interval_end,
          law: request.law,
          metadata: request.metadata,
        }),

      dslControl: ({ control }) =>
        tauri.invoke<Record<string, any>>('dsl_control_command', { control }),

      clusterControl: (request) =>
        tauri.invoke<Record<string, any>>('cluster_control_command', {
          control_type: request.control_type,
          action: request.action,
          target: request.target,
          timestamp: request.timestamp,
          value: request.value,
          interval_start: request.interval_start,
          interval_end: request.interval_end,
          law: request.law,
          metadata: request.metadata,
        }),

      getPendingControls: () =>
        tauri.invoke<Record<string, any>>('get_pending_controls_command'),

      // File Management - with toast for uploads
      uploadIidmFile: (request) =>
        tauri.invoke<Record<string, any>>('upload_iidm_file_command', {
          file_content: request.file_content,
          file_name: request.file_name,
          artifact_id: request.artifact_id,
        }),

      getIidmProperties: ({ file_id }) =>
        tauri.invoke<Record<string, any>>('get_iidm_properties_command', {
          file_id,
        }),

      listSavedSimulations: () =>
        tauri.invoke<SavedSimulation[]>('list_saved_simulations_command'),

      listSavedIidm: () => tauri.invoke<SavedIidm[]>('list_saved_iidm_command'),

      // Events and Queue - silent operations
      listEvents: (request) =>
        tauri.invoke<EventItem[]>('list_events_command', {
          status: request.status,
          source: request.source,
          time_spec: request.time_spec,
          simulation: request.simulation,
          limit: request.limit,
          offset: request.offset,
        }),

      getQueueSummary: () =>
        tauri.invoke<QueueSummary>('get_queue_summary_command'),

      // Status - silent operation
      userStatus: () =>
        tauri.invoke<Record<string, any>>('user_status_command'),
    });
  }),
);
