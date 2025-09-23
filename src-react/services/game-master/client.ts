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
import { withGameMasterToast } from './toast';
import { GameMasterService } from './service';

export const GameMasterServiceLive = Layer.effect(
  GameMasterService,
  Effect.gen(function* () {
    const tauri = yield* TauriService;

    return GameMasterService.of({
      // Configuration - with toast
      setGameMasterUrl: ({ url }) =>
        withGameMasterToast(
          tauri.invoke<{ url: string; message: string }>('set_gamemaster_url', {
            url,
          }),
          'Configuration URL',
        ),

      getGameMasterUrl: () =>
        tauri.invoke<{ url: string; is_default: boolean }>(
          'get_gamemaster_url',
        ),

      // Scenario Management - with toast for mutations
      initScenario: (request) =>
        withGameMasterToast(
          tauri.invoke<SimulationConfig>('init_game_master_scenario', {
            dsl_file_content: request.dsl_file_content,
            simulation_name: request.simulation_name,
            artifact_id: request.artifact_id,
          }),
          'Initialisation du scénario',
        ),

      getDslFile: ({ simulation_name }) =>
        tauri.invoke<string>('get_dsl_file_command', { simulation_name }),

      updateDsl: (request) =>
        withGameMasterToast(
          tauri.invoke<Record<string, any>>('update_dsl_command', {
            simulation_name: request.simulation_name,
            dsl_file_content: request.dsl_file_content,
          }),
          'Mise à jour DSL',
        ),

      deleteDsl: ({ simulation_name }) =>
        withGameMasterToast(
          tauri.invoke<Record<string, any>>('delete_dsl_command', {
            simulation_name,
          }),
          'Suppression DSL',
        ),

      enqueueNextStepDsl: ({ dsl }) =>
        withGameMasterToast(
          tauri.invoke<Record<string, any>>('enqueue_next_step_dsl_command', {
            dsl,
          }),
          'Planification étape suivante',
          false, // Silent operation
        ),

      // Simulation Control - with toast for control operations
      simulatorControl: ({ current_time }) =>
        withGameMasterToast(
          tauri.invoke<AggregateOutput>('simulator_control_command', {
            current_time,
          }),
          'Contrôle simulateur',
          false, // Silent operation
        ),

      simulatorControlV2: ({ current_time }) =>
        withGameMasterToast(
          tauri.invoke<Record<string, any>>('simulator_control_v2_command', {
            current_time,
          }),
          'Contrôle simulateur V2',
          false, // Silent operation
        ),

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
        withGameMasterToast(
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
          'Contrôle utilisateur',
        ),

      dslControl: ({ control }) =>
        withGameMasterToast(
          tauri.invoke<Record<string, any>>('dsl_control_command', { control }),
          'Contrôle DSL',
          false, // Silent operation
        ),

      clusterControl: (request) =>
        withGameMasterToast(
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
          'Contrôle cluster',
        ),

      getPendingControls: () =>
        tauri.invoke<Record<string, any>>('get_pending_controls_command'),

      // File Management - with toast for uploads
      uploadIidmFile: (request) =>
        withGameMasterToast(
          tauri.invoke<Record<string, any>>('upload_iidm_file_command', {
            file_content: request.file_content,
            file_name: request.file_name,
            artifact_id: request.artifact_id,
          }),
          'Upload fichier IIDM',
        ),

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
