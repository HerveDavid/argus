export type ModeType = 'Scada' | 'GameMaster' | 'Kpi';

export interface ModeCommand {
  type: ModeType;
}
