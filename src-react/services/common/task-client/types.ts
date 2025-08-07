export interface TaskStatus {
  id: string;
  exists: boolean;
  paused: boolean | null;
}

export interface TaskActionResponse {
  success: boolean;
  message: string;
  task_status?: TaskStatus;
}

export interface TasksListResponse {
  active_tasks: TaskStatus[];
  total_count: number;
}

export interface TasksStatistics {
  total_tasks: number;
  active_tasks: number;
  paused_tasks: number;
  running_tasks: number;
}

export interface TaskInfo {
  taskId: string;
  status: TaskStatus;
  isRunning: boolean;
  isPaused: boolean;
  exists: boolean;
}
