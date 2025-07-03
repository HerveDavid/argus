// hooks/useEquipmentInfoParser.ts
import { useEffect, useState } from 'react';
import {
  SWITCH_COMPONENT_TYPES,
  FEEDER_COMPONENT_TYPES,
  BUSBAR_SECTION_TYPES,
  SldMetadata,
  Node,
} from '@/types/sld-metadata';
import { EquipmentInfo, EquipmentAttribute } from '../types';

export const useEquipmentInfoParser = (
  targetElement: SVGElement | null,
  metadata?: SldMetadata
) => {
  const [equipmentInfo, setEquipmentInfo] = useState<EquipmentInfo | null>(null);
  const [attributes, setAttributes] = useState<EquipmentAttribute[]>([]);

  const getComponentTypeFromClasses = (classList: string[]): string | null => {
    for (const cls of classList) {
      if (cls.startsWith('sld-')) {
        const potentialType = cls.replace('sld-', '').toUpperCase();

        if (SWITCH_COMPONENT_TYPES.has(potentialType)) return potentialType;
        if (FEEDER_COMPONENT_TYPES.has(potentialType)) return potentialType;
        if (BUSBAR_SECTION_TYPES.has(potentialType)) return potentialType;

        if (potentialType === 'LABEL') return 'LABEL';
        if (potentialType === 'WIRE' || potentialType === 'LINE') return 'WIRE';
        if (potentialType === 'BUS') return 'BUS';
        if (potentialType === 'VOLTAGE_LEVEL') return 'VOLTAGE_LEVEL';
      }
    }
    return null;
  };

  const findNodeInfo = (elementId: string, metadata?: SldMetadata): Node | null => {
    if (!metadata || !elementId) return null;

    return (
      metadata.nodes.find(
        (node) => node.id === elementId || node.equipmentId === elementId,
      ) || null
    );
  };

  const extractEquipmentId = (elementId: string, classList: string[]): string | null => {
    if (elementId && !elementId.includes('_')) {
      return elementId;
    }

    if (elementId && elementId.includes('_')) {
      const parts = elementId.split('_');
      if (parts.length > 1) {
        return parts[0];
      }
    }

    return null;
  };

  const createEquipmentInfo = (
    tagName: string,
    id: string,
    classList: string[],
    text: string,
    componentType: string | null,
    equipmentId: string | null,
    nodeInfo: Node | null
  ): EquipmentInfo => {
    const baseInfo = {
      tagName,
      id,
      classes: classList,
      text,
      componentType: nodeInfo?.componentType || componentType,
      equipmentId: nodeInfo?.equipmentId || equipmentId,
      nodeInfo,
    };

    const isBreaker = classList.includes('sld-breaker');
    const isLine = nodeInfo?.componentType === 'LINE' || componentType === 'LINE';
    const isLabel = classList.includes('sld-label');

    if (isBreaker) {
      return {
        ...baseInfo,
        type: 'breaker',
        isBreaker: true,
        isClosed: classList.includes('sld-closed'),
      };
    }

    if (isLine && nodeInfo?.nextVId) {
      return {
        ...baseInfo,
        type: 'line',
        isLine: true,
        nextVId: nodeInfo.nextVId,
      };
    }

    if (isLabel && text) {
      return {
        ...baseInfo,
        type: 'label',
        isLabel: true,
        text,
      };
    }

    return {
      ...baseInfo,
      type: 'generic',
      isBreaker: false,
      isLine: false,
      isLabel: false,
    };
  };

  useEffect(() => {
    if (targetElement) {
      // Get attributes
      const attrs: EquipmentAttribute[] = [];
      for (let i = 0; i < targetElement.attributes.length; i++) {
        const attr = targetElement.attributes[i];
        attrs.push({ name: attr.name, value: attr.value });
      }
      setAttributes(attrs);

      // Get element info
      const tagName = targetElement.tagName;
      const id = targetElement.id || '';
      const classList = targetElement.getAttribute('class')?.split(' ').filter(Boolean) || [];
      const text = targetElement.textContent || '';

      const componentType = getComponentTypeFromClasses(classList);
      const equipmentId = extractEquipmentId(id, classList);
      const nodeInfo = findNodeInfo(id, metadata) || findNodeInfo(equipmentId || '', metadata);

      const info = createEquipmentInfo(
        tagName,
        id,
        classList,
        text,
        componentType,
        equipmentId,
        nodeInfo
      );

      setEquipmentInfo(info);
    }
  }, [targetElement, metadata]);

  return {
    equipmentInfo,
    attributes,
  };
};