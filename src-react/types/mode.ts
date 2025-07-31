export type AppMode = 'GameMaster' | 'Scada';

export interface AppContext {
  currentMode: AppMode;
  lastModeChange: Date;
  isTransitioning: boolean;
}
