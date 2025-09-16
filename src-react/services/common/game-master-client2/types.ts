// types.ts
export interface SimulationConfig {
  simulation_name: string;
  start_time: number;
  end_time: number;
  time_step: number;
  current_step: number;
  actions: Action[];
}

export interface Action {
  timestamp: number;
  action_type: string;
  details: ActionDetails;
  interval_start?: number;
  interval_end?: number;
  law?: string;
  metadata?: Record<string, any>;
}

export interface ActionDetails {
  element_id?: string | string[];
  percentage?: number;
  component_type?: string;
  id?: string;
  additional_params?: Record<string, any>;
}

export interface AggregateOutput {
  simulation_name: string;
  start_time: number;
  end_time: number;
  time_step: number;
  current_step: number;
  actions: Action[];
}

export type ClusterTarget = string[] | Record<string, any>;

// Request types
export interface InitScenarioRequest {
  dsl_file_content: number[];
  simulation_name?: string;
  artifact_id?: string;
}

export interface TrainerUpdateSystemStateRequest {
  current_time: number;
  state?: Record<string, any>;
}

export interface TrainerGetCurrentStateRequest {
  start_time?: number;
  end_time?: number;
}

export interface GetDslFileRequest {
  simulation_name: string;
}

export interface SimulatorControlRequest {
  current_time: number;
}

export interface SimUpdateSystemStateRequest {
  current_time: number;
  state?: Record<string, any>;
}

export interface SimulatorControlV2Request {
  current_time: number;
}

export interface UserControlRequest {
  control_type: string;
  action: string;
  id: string;
  timestamp: number;
  value?: number;
  interval_start?: number;
  interval_end?: number;
  law?: string;
  metadata?: Record<string, any>;
}

export interface DslControlRequest {
  control: string;
}

export interface ClusterControlRequest {
  control_type: string;
  action: string;
  target: ClusterTarget;
  timestamp: number;
  value?: number;
  interval_start?: number;
  interval_end?: number;
  law?: string;
  metadata?: Record<string, any>;
}

export interface UploadIidmFileRequest {
  file_content: number[];
  file_name: string;
  artifact_id?: string;
}

export interface GetIidmPropertiesRequest {
  file_id: string;
}

export interface ListEventsRequest {
  status?: string;
  source?: string;
  time_spec?: string;
  simulation?: string;
  limit?: number;
  offset?: number;
}