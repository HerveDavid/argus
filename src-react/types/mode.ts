export type AppMode = 'GameMaster' | 'Scada' | 'Kpi';

export interface AppContext {
  currentMode: AppMode;
  lastModeChange: Date;
  isTransitioning: boolean;
}
