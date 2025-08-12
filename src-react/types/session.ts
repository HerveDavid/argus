export interface RootConfig {
  name: string;
  source: string;
  configuration: Configuration;
}

export interface Configuration {
  status: string;
  log_level: string;
  sections: string[];
  master: Master;
  hmi: Hmi;
  game_master: GameMaster;
  network: Network;
  source: string;
  loaded_at: string; // ISO 8601 date string
}

export interface Master {
  period: number;
  speedup: number;
  dynawo_configured: boolean;
}

export interface Hmi {
  location: string;
  slider_count: number;
  substations_count: number;
  bool_buttons_count: number;
}

export interface GameMaster {
  slider_count: number;
  substations_count: number;
  bool_buttons_count: number;
}

export interface Network {
  iidm_file_path: string;
  par_file_path: string;
  job_file_path: string;
  base_directory: string | null;
}

export interface Session {
  name: string;
  path: string;
  lastAccessed: Date;
}
