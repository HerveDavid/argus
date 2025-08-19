import { isLegacyMessage, isTSTMMessage, ScadaMessage } from '@/types/tstm';

export interface ScadaOutput {
  id: string;
  dynawo_id: string;
  tase2: string;
  source: string;
  destination: string;
  topic: string;
  graphical_id: string;
  publish_on_change: boolean | null;
}

export interface ScadaDataPoint {
  id: string;
  graphical_id: string;
  value: any;
  timestamp?: number;
  validity?: string;
  type?: 'TS' | 'TM';
  format: 'TS_TM' | 'Legacy';
}

export function createScadaDataPoint(
  output: ScadaOutput,
  message: ScadaMessage,
): ScadaDataPoint | null {
  // // Vérifier que les IDs correspondent
  // if (output.dynawo_id !== message.id) {
  //   return null;
  // }

  // Extraire la valeur selon le type de message
  let value: any;
  let timestamp: number | undefined;
  let validity: string | undefined;
  let type: 'TS' | 'TM' | undefined;
  let format: 'TS_TM' | 'Legacy';

  if (isTSTMMessage(message)) {
    value = message.value ?? message.stVal;
    timestamp = message.timestamp;
    validity = message.validity;
    type = message.type;
    format = 'TS_TM';
  } else if (isLegacyMessage(message)) {
    value = message.value;
    timestamp = message.time_received;
    format = 'Legacy';
  } else {
    // Message Fallback - pas de valeur exploitable
    return null;
  }

  return {
    id: output.id,
    graphical_id: output.graphical_id,
    value,
    timestamp,
    validity,
    type,
    format,
  };
}

// Fonction utilitaire pour créer plusieurs ScadaDataPoints à partir de listes
export function createScadaDataPoints(
  outputs: ScadaOutput[],
  messages: ScadaMessage[],
): ScadaDataPoint[] {
  const messageMap = new Map(messages.map((msg) => [msg.id, msg]));

  return outputs
    .map((output) => {
      const message = messageMap.get(output.id);
      return message ? createScadaDataPoint(output, message) : null;
    })
    .filter((dataPoint): dataPoint is ScadaDataPoint => dataPoint !== null);
}
