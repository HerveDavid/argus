import { FEEDER_COMPONENT_TYPES, SldMetadata } from '@/types/sld-metadata';
import {
  toStrictNode,
  isKnownComponentType,
  KnownComponentType,
} from '@/types/component';

import { ElementInfo, ELEMENT_CONFIG } from '../types/element-info.type';
import { Attribute } from '../types/attribute.type';
import {
  extractEquipmentId,
  extractParentEquipmentId,
  getMeasurementTypeFromClasses,
} from '../utils/element-getters';
import { findBestMatchingNode } from './node-finder';

export const extractElementAttributes = (element: SVGElement): Attribute[] => {
  const attrs: Attribute[] = [];
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attrs.push({ name: attr.name, value: attr.value });
  }
  return attrs;
};

export const extractElementInfo = (
  element: SVGElement,
  metadata?: SldMetadata,
): ElementInfo => {
  const tagName = element.tagName;
  const id = element.id || '';
  const classList =
    element.getAttribute('class')?.split(' ').filter(Boolean) || [];
  const text = element.textContent || '';

  // Element classification basée sur les classes CSS
  const isLabel = classList.includes(ELEMENT_CONFIG.classes.label);
  const isBreaker = classList.includes(ELEMENT_CONFIG.classes.breaker);
  const isClosed = classList.includes(ELEMENT_CONFIG.classes.closed);

  // Measurement detection
  const measurementType = getMeasurementTypeFromClasses(classList);
  const isMeasurement = measurementType !== null;
  const measurementValue = isMeasurement ? text : null;

  // Equipment ID extraction
  const equipmentId = extractEquipmentId(id);
  const parentEquipmentId = isMeasurement ? extractParentEquipmentId(id) : null;

  // 🎯 Recherche et conversion du node en StrictNode
  const { node: rawNode } = findBestMatchingNode(
    id,
    equipmentId,
    parentEquipmentId,
    metadata,
  );

  const node = toStrictNode(rawNode);

  // 🎯 Type-safe component type determination
  const componentType: KnownComponentType | 'UNKNOWN' | null =
    node?.componentType && isKnownComponentType(node.componentType)
      ? node.componentType
      : node?.componentType
        ? 'UNKNOWN'
        : null;

  // Line detection avec type safety
  const isLine = node?.componentType === 'LINE';
  const nextVId = node?.nextVId || null;

  console.log(`🎯 Enhanced Element ${id}:`, {
    nodeType: node?.componentType,
    typedNodeType: componentType,
    isKnownType: componentType !== 'UNKNOWN' && componentType !== null,
    equipmentId: node?.equipmentId,
  });

  console.log(`DEBUG ${id}:`, {
    rawNodeType: rawNode?.componentType,
    isKnownType: isKnownComponentType(rawNode?.componentType),
    FEEDER_COMPONENT_TYPES: Array.from(FEEDER_COMPONENT_TYPES),
    finalComponentType: componentType,
  });

  return {
    tagName,
    id,
    classes: classList,
    isLabel,
    text,
    isBreaker,
    isClosed,
    node,
    componentType,
    equipmentId: node?.equipmentId || equipmentId,
    isLine,
    nextVId,
    isMeasurement,
    measurementType,
    measurementValue,
    parentEquipmentId,
  };
};
