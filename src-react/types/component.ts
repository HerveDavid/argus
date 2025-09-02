import {
  Node,
  SWITCH_COMPONENT_TYPES,
  FEEDER_COMPONENT_TYPES,
  BUSBAR_SECTION_TYPES,
} from '@/types/sld-metadata';

export type SwitchComponentType =
  | 'BREAKER'
  | 'DISCONNECTOR'
  | 'LOAD_BREAK_SWITCH';

export type FeederComponentType =
  | 'LINE'
  | 'LOAD'
  | 'BATTERY'
  | 'DANGLING_LINE'
  | 'TIE_LINE'
  | 'GENERATOR'
  | 'VSC_CONVERTER_STATION'
  | 'LCC_CONVERTER_STATION'
  | 'HVDC_LINE'
  | 'CAPACITOR'
  | 'INDUCTOR'
  | 'STATIC_VAR_COMPENSATOR'
  | 'TWO_WINDINGS_TRANSFORMER'
  | 'TWO_WINDINGS_TRANSFORMER_LEG'
  | 'THREE_WINDINGS_TRANSFORMER'
  | 'THREE_WINDINGS_TRANSFORMER_LEG'
  | 'PHASE_SHIFT_TRANSFORMER';

export type BusbarComponentType = 'BUSBAR_SECTION';

export type KnownComponentType =
  | SwitchComponentType
  | FeederComponentType
  | BusbarComponentType;

// Types spécialisés pour les Nodes
export interface TypedNode<T extends KnownComponentType = KnownComponentType>
  extends Node {
  componentType: T;
  // Propriétés additionnelles selon le type
}

export interface SwitchNode extends TypedNode<SwitchComponentType> {
  open: boolean; // Toujours présent pour les switches
}

export interface FeederNode extends TypedNode<FeederComponentType> {
  measurements?: Node['measurements']; // Mesures disponibles pour les feeders
  nextVId?: string; // Navigation possible
}

export interface BusbarNode extends TypedNode<BusbarComponentType> {
  vid: string; // VID toujours présent pour les busbars
}

export interface UnknownNode extends Node {
  componentType?: string; // Type inconnu ou non défini
}

// Union type pour tous les types de nodes
export type StrictNode = SwitchNode | FeederNode | BusbarNode | UnknownNode;

// 🎯 Type Guards pour valider et typer les nodes
export const isSwitchComponentType = (
  type: string | undefined,
): type is SwitchComponentType => {
  return type ? SWITCH_COMPONENT_TYPES.has(type) : false;
};

export const isFeederComponentType = (
  type: string | undefined,
): type is FeederComponentType => {
  return type ? FEEDER_COMPONENT_TYPES.has(type) : false;
};

export const isBusbarComponentType = (
  type: string | undefined,
): type is BusbarComponentType => {
  return type ? BUSBAR_SECTION_TYPES.has(type) : false;
};

export const isKnownComponentType = (
  type: string | undefined,
): type is KnownComponentType => {
  return (
    isSwitchComponentType(type) ||
    isFeederComponentType(type) ||
    isBusbarComponentType(type)
  );
};

// Type Guards pour les nodes typés
export const isSwitchNode = (node: Node | null): node is SwitchNode => {
  return node ? isSwitchComponentType(node.componentType) : false;
};

export const isFeederNode = (node: Node | null): node is FeederNode => {
  return node ? isFeederComponentType(node.componentType) : false;
};

export const isBusbarNode = (node: Node | null): node is BusbarNode => {
  return node ? isBusbarComponentType(node.componentType) : false;
};

export const isUnknownNode = (node: Node | null): node is UnknownNode => {
  return node ? !isKnownComponentType(node.componentType) : false;
};

// 🎯 Fonction pour convertir un Node générique en StrictNode
export const toStrictNode = (node: Node | null): StrictNode | null => {
  if (!node) return null;

  if (isSwitchNode(node)) {
    return node as SwitchNode;
  }

  if (isFeederNode(node)) {
    return node as FeederNode;
  }

  if (isBusbarNode(node)) {
    return node as BusbarNode;
  }

  return node as UnknownNode;
};
