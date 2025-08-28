import React, { useEffect, useState } from 'react';
import { useMetadata } from '../providers/metadata.provider';
import { ElementInfo } from '../types/element-info.type';
import {
  extractEquipmentId,
  extractParentEquipmentId,
  findNodeInfo,
  getComponentTypeFromClasses,
  getMeasurementTypeFromClasses,
} from '../utils/element-getters';
import { SldMetadata } from '@/types/sld-metadata';
import { Result } from '@effect-atom/atom-react';
import { Attribute } from '../types/attribute.type';
import { ContextMenu, ContextMenuContent } from '@/components/ui/context-menu';
import { ContextMenuTrigger } from '@radix-ui/react-context-menu';

interface ElementControlsProps {
  children: React.ReactNode;
  targetElement: SVGElement | null;
}

export const ElementControls: React.FC<ElementControlsProps> = ({
  children,
  targetElement,
}) => {
  // Hooks
  const { metadata: metadataResult } = useMetadata();

  // States
  const [metadata, setMetadata] = useState<SldMetadata>();
  const [elementInfo, setElementInfo] = useState<ElementInfo>();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);

  // Effects
  useEffect(() => {
    Result.match(metadataResult, {
      onFailure() {},
      onInitial() {},
      onSuccess({ value }) {
        setMetadata(value.metadata);
      },
    });
  }, [metadataResult, setMetadata]);

  useEffect(() => {
    if (targetElement) {
      // Get attributes
      const attrs: { name: string; value: string }[] = [];
      for (let i = 0; i < targetElement.attributes.length; i++) {
        const attr = targetElement.attributes[i];
        attrs.push({ name: attr.name, value: attr.value });
      }
      setAttributes(attrs);

      // Get element info
      const tagName = targetElement.tagName;
      const id = targetElement.id || '';
      const classList =
        targetElement.getAttribute('class')?.split(' ').filter(Boolean) || [];
      const isLabel = classList.includes('sld-label');
      const isBreaker = classList.includes('sld-breaker');
      const isClosed = classList.includes('sld-closed');
      const text = targetElement.textContent || '';

      // Vérifier si c'est une mesure
      const measurementType = getMeasurementTypeFromClasses(classList);
      const isMeasurement = measurementType !== null;

      // Déterminer le type de composant
      const componentType = getComponentTypeFromClasses(classList);

      // Extraire l'equipment ID
      const equipmentId = extractEquipmentId(id);

      // Pour les mesures, extraire l'ID de l'équipement parent
      const parentEquipmentId = isMeasurement
        ? extractParentEquipmentId(id)
        : null;

      // Trouver les informations du nœud dans les métadonnées
      const nodeInfo =
        findNodeInfo(id, metadata) ||
        findNodeInfo(equipmentId || '', metadata) ||
        findNodeInfo(parentEquipmentId || '', metadata);

      // Vérifier si c'est une ligne et récupérer le nextVId
      const isLine =
        nodeInfo?.componentType === 'LINE' || componentType === 'LINE';
      const nextVId = nodeInfo?.nextVId || null;

      // Extraire la valeur de la mesure si c'est un élément de mesure
      const measurementValue = isMeasurement ? text : null;

      setElementInfo({
        tagName,
        id,
        classes: classList,
        isLabel,
        text,
        isBreaker,
        isClosed,
        componentType: nodeInfo?.componentType || componentType,
        equipmentId: nodeInfo?.equipmentId || equipmentId,
        nodeInfo,
        isLine,
        nextVId,
        isMeasurement,
        measurementType,
        measurementValue,
        parentEquipmentId,
      });
    } else {
      if (!contextMenuOpen) {
        setElementInfo(undefined);
        setAttributes([]);
      }
    }
  }, [targetElement, metadata, contextMenuOpen]);

  const handleContextMenuOpenChange = (open: boolean) => {
    setContextMenuOpen(open);
    if (!open && !targetElement) {
      setElementInfo(undefined);
      setAttributes([]);
    }
  };

  return (
    <ContextMenu onOpenChange={handleContextMenuOpenChange}>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      {elementInfo && (
        <ContextMenuContent>#{elementInfo.id}</ContextMenuContent>
      )}
    </ContextMenu>
  );
};
