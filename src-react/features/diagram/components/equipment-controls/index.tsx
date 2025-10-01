import React, { useEffect, useState } from 'react';
import { Result } from '@effect-atom/atom-react';
import { ContextMenuTrigger } from '@radix-ui/react-context-menu';

import { useMetadata } from '../../providers/metadata.provider';
import { ElementInfo } from '../../types/element-info.type';
import {
  extractEquipmentId,
  extractParentEquipmentId,
  findNodeInfo,
  getComponentTypeFromClasses,
  getMeasurementTypeFromClasses,
} from '../../utils/element-getters';
import { SldMetadata } from '@/types/sld-metadata';
import { Attribute } from '../../types/attribute.type';
import { ContextMenu, ContextMenuContent } from '@/components/ui/context-menu';
import { EquipmentMenu } from './equipment-menu';
import { useDiagram } from '../../providers/diagram.provider';
import { useBreakerToggle } from '@/features/single-line-diagram/features/diagram-visualization';
import { invoke } from '@tauri-apps/api/core';

interface EquipmentControlsProps {
  children: React.ReactNode;
  targetElement: SVGElement | null;
}

export const EquipmentControls: React.FC<EquipmentControlsProps> = ({
  children,
  targetElement,
}) => {
  // Hooks
  const { svgRef } = useDiagram();
  const { toggleBreaker } = useBreakerToggle(svgRef);
  const { metadata: metadataResult } = useMetadata();

  // States
  const [metadata, setMetadata] = useState<SldMetadata>();
  const [elementInfo, setElementInfo] = useState<ElementInfo>();
  const [_, setAttributes] = useState<Attribute[]>([]);
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

  const handleToggleBreaker = async (breakerId: string, isClosed: boolean) => {
    const value = isClosed ? 1.0 : 0.0; // Ajouter la valeur basée sur l'état
    console.log('value: ' + value);
    await invoke('send_command_breaker_gm', {
      graphical_id: breakerId,
      value,
    })
      .finally(() => {
        toggleBreaker(breakerId, isClosed);
      })
      .finally(() => {
        console.log('done');
      });
  };

  return (
    <ContextMenu onOpenChange={handleContextMenuOpenChange}>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      {elementInfo && (
        <ContextMenuContent>
          <EquipmentMenu
            elementInfo={elementInfo}
            onToggleBreaker={handleToggleBreaker}
          />
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
};
