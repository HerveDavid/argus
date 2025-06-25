export interface Project {
  name: string;
  path: string;
  configPath: string;
  lastAccessed: Date;
}

export interface QueryResponse {
  columns: string[];
  data: any[];
  row_count: number;
}

export interface CreateProjectParams {
  name: string;
  path: string;
  configPath: string;
}

export interface NetworkInfo {
  file_path: string;
  network_id: string;
  buses_count: number;
  lines_count: number;
  generators_count: number;
  loads_count: number;
}