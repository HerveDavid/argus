import node_breaker_events from '@/../tests/dynawo/node_breaker_events.json';

export interface OpenDj {
  equipement_id: string;
  value: '1';
  event_string: string;
}

export interface CloseDj {
  equipement_id: string;
  value: '0';
  event_string: string;
}

export function get_open_dj_from_equipement_id(equiment_id: string) {
  const event = node_breaker_events.events.find(
    (item) =>
      item.equipement_id.includes(equiment_id) &&
      item.event_string.includes('Open_'),
  );

  if (event) {
    return {
      found: true,
      data: event as OpenDj,
    };
  }

  return {
    found: false,
  };
}

export function get_close_dj_from_equipement_id(equiment_id: string) {
  const event = node_breaker_events.events.find(
    (item) =>
      item.equipement_id.includes(equiment_id) &&
      item.event_string.includes('Close_'),
  );

  if (event) {
    return {
      found: true,
      data: event as CloseDj,
    };
  }

  return {
    found: false,
  };
}
