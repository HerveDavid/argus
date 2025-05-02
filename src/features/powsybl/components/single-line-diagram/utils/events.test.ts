import { describe, it, expect, vi } from 'vitest';
import {
  get_open_dj_from_equipement_id,
  get_close_dj_from_equipement_id,
} from './events'; // Ajustez le chemin selon votre structure de projet

// Mock des données node_breaker_events.json
vi.mock('@/../tests/dynawo/node_breaker_events.json', () => ({
  default: {
    events: [
      {
        equipement_id: 'MQIS P6_MQIS 6FLEAC.1 SA.1_OC',
        value: '1',
        event_string:
          'Open_MQIS P6_MQIS 6FLEAC.1 SA.1_OC,event_tEvent,double,0,event_open,bool,1',
      },
      {
        equipement_id: 'MQIS P6_MQIS 6BLAY5.1 SA.2_OC',
        value: '1',
        event_string:
          'Open_MQIS P6_MQIS 6BLAY5.1 SA.2_OC,event_tEvent,double,0,event_open,bool,1',
      },
      {
        equipement_id: 'MQIS P6_MQIS 6FLEAC.1 SA.1_OC',
        value: '0',
        event_string:
          'Close_MQIS P6_MQIS 6FLEAC.1 SA.1_OC,event_tEvent,double,0,event_open,bool,0',
      },
      {
        equipement_id: 'MQIS P6_MQIS 6BLAY5.1 SA.2_OC',
        value: '0',
        event_string:
          'Close_MQIS P6_MQIS 6BLAY5.1 SA.2_OC,event_tEvent,double,0,event_open,bool,0',
      },
    ],
  },
}));

describe('Node Breaker Events Functions', () => {
  describe('get_open_dj_from_equipement_id', () => {
    it("devrait retourner l'événement Open pour un equipement_id existant", () => {
      // Cas 1: Correspondance exacte
      const result1 = get_open_dj_from_equipement_id(
        'MQIS P6_MQIS 6FLEAC.1 SA.1_OC',
      );
      expect(result1.found).toBe(true);
      expect(result1.data).toEqual({
        equipement_id: 'MQIS P6_MQIS 6FLEAC.1 SA.1_OC',
        value: '1',
        event_string:
          'Open_MQIS P6_MQIS 6FLEAC.1 SA.1_OC,event_tEvent,double,0,event_open,bool,1',
      });

      // Cas 2: Correspondance partielle
      const result2 = get_open_dj_from_equipement_id('6FLEAC.1 SA.1');
      expect(result2.found).toBe(true);
      expect(result2.data).toEqual({
        equipement_id: 'MQIS P6_MQIS 6FLEAC.1 SA.1_OC',
        value: '1',
        event_string:
          'Open_MQIS P6_MQIS 6FLEAC.1 SA.1_OC,event_tEvent,double,0,event_open,bool,1',
      });
    });

    it('devrait retourner found: false pour un equipement_id inexistant', () => {
      const result = get_open_dj_from_equipement_id('MQIS P6_INEXISTANT');
      expect(result.found).toBe(false);
      expect(result.data).toBeUndefined();
    });
  });

  describe('get_close_dj_from_equipement_id', () => {
    it("devrait retourner l'événement Close pour un equipement_id existant", () => {
      // Cas 1: Correspondance exacte
      const result1 = get_close_dj_from_equipement_id(
        'MQIS P6_MQIS 6FLEAC.1 SA.1_OC',
      );
      expect(result1.found).toBe(true);
      expect(result1.data).toEqual({
        equipement_id: 'MQIS P6_MQIS 6FLEAC.1 SA.1_OC',
        value: '0',
        event_string:
          'Close_MQIS P6_MQIS 6FLEAC.1 SA.1_OC,event_tEvent,double,0,event_open,bool,0',
      });

      // Cas 2: Correspondance partielle
      const result2 = get_close_dj_from_equipement_id('6BLAY5.1 SA.2');
      expect(result2.found).toBe(true);
      expect(result2.data).toEqual({
        equipement_id: 'MQIS P6_MQIS 6BLAY5.1 SA.2_OC',
        value: '0',
        event_string:
          'Close_MQIS P6_MQIS 6BLAY5.1 SA.2_OC,event_tEvent,double,0,event_open,bool,0',
      });
    });

    it('devrait retourner found: false pour un equipement_id inexistant', () => {
      const result = get_close_dj_from_equipement_id('MQIS P6_INEXISTANT');
      expect(result.found).toBe(false);
      expect(result.data).toBeUndefined();
    });
  });

  describe('Test des cas limites', () => {


    it('devrait être sensible à la casse', () => {
      // Tester avec des minuscules alors que l'original est en majuscules
      const resultOpen = get_open_dj_from_equipement_id(
        'mqis p6_mqis 6fleac.1 sa.1_oc',
      );
      // Si l'implémentation est sensible à la casse, aucun événement ne sera trouvé
      expect(resultOpen.found).toBe(false);
    });
  });
});
