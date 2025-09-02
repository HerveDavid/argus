import { Node } from '@/types/sld-metadata';
import {
  ElementInfo,
  ComponentTypeGuard,
  ElementTypePredicates,
} from '../types/element-info.type';
import { ELEMENT_CONFIG } from '../types/element-info.type';
import {
  isSwitchNode,
  isFeederNode,
  isBusbarNode,
  isUnknownNode,
  SwitchNode,
  FeederNode,
} from '@/types/component';

// 🎯 Prédicats spécifiques avec type safety complète
export const isSpecificFeederType = <T extends string>(
  node: FeederNode | null,
  type: T,
): node is FeederNode & { componentType: T } => {
  return node?.componentType === type;
};

export const isSpecificSwitchType = <T extends string>(
  node: SwitchNode | null,
  type: T,
): node is SwitchNode & { componentType: T } => {
  return node?.componentType === type;
};

// Type guards pour les différents types de composants
export const isLineNode: ComponentTypeGuard<'LINE'> = (
  node,
): node is Node & { componentType: 'LINE' } => {
  return node?.componentType === ELEMENT_CONFIG.componentTypes.LINE;
};

export const isBreakerNode: ComponentTypeGuard<'BREAKER'> = (
  node,
): node is Node & { componentType: 'BREAKER' } => {
  return node?.componentType === ELEMENT_CONFIG.componentTypes.BREAKER;
};

export const isGeneratorNode: ComponentTypeGuard<'GENERATOR'> = (
  node,
): node is Node & { componentType: 'GENERATOR' } => {
  return node?.componentType === ELEMENT_CONFIG.componentTypes.GENERATOR;
};

export const isTransformerNode: ComponentTypeGuard<'TRANSFORMER'> = (
  node,
): node is Node & { componentType: 'TRANSFORMER' } => {
  return node?.componentType === ELEMENT_CONFIG.componentTypes.TRANSFORMER;
};

export const isBusNode: ComponentTypeGuard<'BUS'> = (
  node,
): node is Node & { componentType: 'BUS' } => {
  return node?.componentType === ELEMENT_CONFIG.componentTypes.BUS;
};

// Prédicats pour les éléments (type-driven approach)
export const elementTypePredicates: ElementTypePredicates = {
  isSwitchElement: (elementInfo: ElementInfo): boolean =>
    isSwitchNode(elementInfo.node),

  isFeederElement: (elementInfo: ElementInfo): boolean =>
    isFeederNode(elementInfo.node),

  isBusbarElement: (elementInfo: ElementInfo): boolean =>
    isBusbarNode(elementInfo.node),

  isLineElement: (elementInfo: ElementInfo): boolean =>
    isFeederNode(elementInfo.node) && elementInfo.node.componentType === 'LINE',

  isBreakerElement: (elementInfo: ElementInfo): boolean =>
    isSwitchNode(elementInfo.node) &&
    elementInfo.node.componentType === 'BREAKER',

  isGeneratorElement: (elementInfo: ElementInfo): boolean =>
    isFeederNode(elementInfo.node) &&
    elementInfo.node.componentType === 'GENERATOR',

  isTransformerElement: (elementInfo: ElementInfo): boolean =>
    isFeederNode(elementInfo.node) &&
    (elementInfo.node.componentType === 'TWO_WINDINGS_TRANSFORMER' ||
      elementInfo.node.componentType === 'THREE_WINDINGS_TRANSFORMER' ||
      elementInfo.node.componentType === 'PHASE_SHIFT_TRANSFORMER'),

  isMeasurementElement: (elementInfo: ElementInfo): boolean =>
    elementInfo.isMeasurement,

  isUnknownElement: (elementInfo: ElementInfo): boolean =>
    isUnknownNode(elementInfo.node),
};
