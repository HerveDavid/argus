export type TeleInformation =
  | {
      ti: 'TM';
      data: {
        id: string;
        value: number;
      };
    }
  | {
      ti: 'TS';
      data: {
        id: string;
        value: 0 | 1 | -1;
      };
    }
  | {
      ti: 'TC';
      data: {
        id: string;
        value: boolean;
      };
    }
  | {
      ti: 'TVC';
      data: {
        id: string;
        value: number;
      };
    };

//   export type TeleInformation =
// | {
//     ti: 'TM'; // Télémesure
//     data: {
//       id: string; // Identifiant unique du point de mesure
//       value: number; // Valeur mesurée
//       unit: string; // Par exemple: "kV", "MW", "MVAr", "Hz", "A"
//       timestamp: number; // Horodatage de l'acquisition
//       qualityCode: number; // Code qualité selon norme IEC 60870-5-101/104
//       source: string; // Source de la mesure (RTU, compteur, calculée)
//       substationId: string; // Identifiant du poste électrique
//       bayId?: string; // Identifiant de la travée (optionnel)
//       validityStatus: 'valid' | 'invalid' | 'estimated' | 'substituted';
//       alarmThresholds?: { // Seuils d'alarme (optionnel)
//         lowLow?: number;
//         low?: number;
//         high?: number;
//         highHigh?: number;
//       };
//     };
//   }
// | {
//     ti: 'TS'; // Télésignalisation
//     data: {
//       id: string; // Identifiant unique du point de signalisation
//       value: 0 | 1 | -1; // 0: Ouvert/Arrêt, 1: Fermé/Marche, -1: Position intermédiaire
//       timestamp: number; // Horodatage de l'acquisition
//       changeTimestamp?: number; // Horodatage du changement d'état
//       substationId: string; // Identifiant du poste électrique
//       bayId?: string; // Identifiant de la travée (optionnel)
//       equipmentId: string; // Identifiant de l'équipement (disjoncteur, sectionneur...)
//       qualityCode: number; // Code qualité selon norme IEC 60870-5-101/104
//       alarmClass?: number; // Classe d'alarme
//       priority: 0 | 1 | 2 | 3; // Priorité (0: information, 3: critique)
//       ackState: 'noAckRequired' | 'toBeAcked' | 'acked';
//       topoNode?: string; // Nœud topologique (optionnel)
//     };
//   }
// | {
//     ti: 'TC'; // Téléconsignation
//     data: {
//       id: string; // Identifiant unique de la consigne
//       value: boolean; // Valeur de la consigne
//       timestamp: number; // Horodatage de la création
//       executionTimestamp?: number; // Horodatage d'exécution
//       substationId: string; // Identifiant du poste électrique
//       bayId?: string; // Identifiant de la travée (optionnel)
//       equipmentId: string; // Identifiant de l'équipement
//       operatorId: string; // Identifiant de l'opérateur
//       dispatchCenterId: string; // Centre de conduite émetteur
//       commandType: 'direct' | 'select-before-operate' | 'scheduled';
//       status: 'pending' | 'sent' | 'executed' | 'failed' | 'cancelled';
//       securityLevel: number; // Niveau de sécurité (0-3)
//       reason: string; // Motif de la manœuvre
//       workOrderId?: string; // Référence de l'ordre de travail (optionnel)
//     };
//   }
// | {
//     ti: 'TVC'; // Télévaleur de consignation
//     data: {
//       id: string; // Identifiant unique de la consigne
//       value: number; // Valeur de la consigne
//       unit: string; // Unité de la valeur (kV, MW, etc.)
//       timestamp: number; // Horodatage de la création
//       activationTimestamp: number; // Horodatage d'activation
//       expiryTimestamp?: number; // Horodatage d'expiration (optionnel)
//       substationId: string; // Identifiant du poste électrique
//       equipmentId: string; // Identifiant de l'équipement
//       regulationType: 'voltage' | 'power' | 'frequency' | 'current' | 'other';
//       operatorId: string; // Identifiant de l'opérateur
//       dispatchCenterId: string; // Centre de conduite émetteur
//       mode: 'manual' | 'automatic' | 'scheduled' | 'emergency';
//       priority: number; // Priorité (0-9)
//       previousValue?: number; // Valeur précédente (optionnel)
//       controlRange?: { // Plage de régulation (optionnel)
//         min: number;
//         max: number;
//         step?: number;
//       };
//       marketRelated?: boolean; // Lié à une contrainte de marché
//     };
//   };
