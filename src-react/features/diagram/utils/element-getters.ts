import {
  BUSBAR_SECTION_TYPES,
  FEEDER_ACTIVE_POWER_TYPES,
  FEEDER_ANGLE_TYPES,
  FEEDER_COMPONENT_TYPES,
  FEEDER_CURRENT_TYPES,
  FEEDER_REACTIVE_POWER_TYPES,
  FEEDER_VOLTAGE_TYPES,
  MeasurementType,
  SldMetadata,
  SWITCH_COMPONENT_TYPES,
  Node,
} from '@/types/sld-metadata';

// Fonction pour déterminer le type de mesure à partir des classes CSS
export const getMeasurementTypeFromClasses = (
  classList: string[],
): MeasurementType | null => {
  for (const cls of classList) {
    if (cls.startsWith('sld-')) {
      const potentialType = cls
        .replace('sld-', '')
        .toUpperCase()
        .replace('-', '_');

      if (
        FEEDER_ACTIVE_POWER_TYPES.has(potentialType) ||
        potentialType === 'ACTIVE_POWER'
      ) {
        return 'ACTIVE_POWER';
      }
      if (
        FEEDER_CURRENT_TYPES.has(potentialType) ||
        potentialType === 'CURRENT'
      ) {
        return 'CURRENT';
      }
      if (
        FEEDER_REACTIVE_POWER_TYPES.has(potentialType) ||
        potentialType === 'REACTIVE_POWER'
      ) {
        return 'REACTIVE_POWER';
      }
      if (
        FEEDER_VOLTAGE_TYPES.has(potentialType) ||
        potentialType === 'VOLTAGE'
      ) {
        return 'VOLTAGE';
      }
      if (FEEDER_ANGLE_TYPES.has(potentialType) || potentialType === 'ANGLE') {
        return 'ANGLE';
      }
    }
  }
  return null;
};

// Fonction pour déterminer le type de composant à partir des classes CSS
export const getComponentTypeFromClasses = (
  classList: string[],
): string | null => {
  for (const cls of classList) {
    if (cls.startsWith('sld-')) {
      const potentialType = cls
        .replace('sld-', '')
        .toUpperCase()
        .replace('-', '_');

      // Vérifiez contre les types connus
      if (SWITCH_COMPONENT_TYPES.has(potentialType)) {
        return potentialType;
      }
      if (FEEDER_COMPONENT_TYPES.has(potentialType)) {
        return potentialType;
      }
      if (BUSBAR_SECTION_TYPES.has(potentialType)) {
        return potentialType;
      }

      // Types spéciaux
      if (potentialType === 'LABEL') return 'LABEL';
      if (potentialType === 'WIRE' || potentialType === 'LINE') return 'WIRE';
      if (potentialType === 'BUS') return 'BUS';
      if (potentialType === 'VOLTAGE_LEVEL') return 'VOLTAGE_LEVEL';
      if (potentialType === 'FEEDER') return 'FEEDER';
    }
  }
  return null;
};

// Fonction pour trouver les informations du nœud dans les métadonnées
export const findNodeInfo = (
  elementId: string,
  metadata?: SldMetadata,
): Node | null => {
  if (!metadata || !elementId) return null;

  return (
    metadata.nodes.find(
      (node) => node.id === elementId || node.equipmentId === elementId,
    ) || null
  );
};

// Fonction pour extraire l'equipment ID à partir de l'ID de l'élément
export const extractEquipmentId = (elementId: string): string | null => {
  // Parfois l'equipment ID est directement l'ID de l'élément
  if (elementId && !elementId.includes('_')) {
    return elementId;
  }

  // Parfois il faut extraire à partir d'un pattern comme "EQUIPMENT_ID_suffix"
  if (elementId && elementId.includes('_')) {
    const parts = elementId.split('_');
    if (parts.length > 1) {
      return parts[0];
    }
  }

  return null;
};

// Fonction pour extraire l'ID de l'équipement parent pour les mesures
export const extractParentEquipmentId = (elementId: string): string | null => {
  // Pour les mesures, l'ID peut être du type "EQUIPMENT_ID_MEASUREMENT_TYPE"
  if (elementId && elementId.includes('_')) {
    const parts = elementId.split('_');
    if (parts.length >= 2) {
      // Retourne la première partie comme équipement parent
      return parts[0];
    }
  }
  return null;
};
