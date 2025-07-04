export interface FeederStatus {
  id: string;
  exists: boolean;
  paused: boolean | null;
  topic?: string;
}

export interface FeederActionResponse {
  success: boolean;
  message: string;
  feeder_status?: FeederStatus;
}

export interface FeedersListResponse {
  active_feeders: FeederStatus[];
  total_count: number;
}

export interface FeedersStatistics {
  total_feeders: number;
  active_feeders: number;
  paused_feeders: number;
  running_feeders: number;
}
