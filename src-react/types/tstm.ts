interface BaseScadaMessage {
  id: string;
  dynawo_id: string;
  format: string;
}

export interface TSTM extends BaseScadaMessage {
  format: 'TS_TM';
  tase2: string;
  timestamp: number;
  cause: string;
  validity: string;
  operator_blocked: boolean;
  type: 'TS' | 'TM';
  value?: number;
  stVal?: any;
  tfos?: string;
}

export interface LegacyScadaMessage extends BaseScadaMessage {
  format: 'Legacy';
  value?: any;
  time_sent?: number;
  time_received?: number;
  raw_message: any;
}

export interface FallbackScadaMessage {
  id: string;
  raw_payload: string;
  parse_error: string;
  format?: never;
}

export type ScadaMessage = TSTM | LegacyScadaMessage | FallbackScadaMessage;

export function isTSTMMessage(message: ScadaMessage): message is TSTM {
  return message.format === 'TS_TM';
}

export function isLegacyMessage(
  message: ScadaMessage,
): message is LegacyScadaMessage {
  return message.format === 'Legacy';
}

export function isFallbackMessage(
  message: ScadaMessage,
): message is FallbackScadaMessage {
  return 'parse_error' in message;
}
