import { useEffect } from 'react';
import { SldMetadata } from '@/types/sld-metadata';
import {
  extractElementAttributes,
  extractElementInfo,
} from '../utils/element-info-extractor';
import { useElementState } from './use-element-state';
import { elementTypePredicates } from '../utils/element-type-predicates';
import { isBusbarNode, isFeederNode, isSwitchNode } from '@/types/component';

export const useElementInfo = (
  targetElement: SVGElement | null,
  metadata?: SldMetadata,
) => {
  const { state, actions } = useElementState();

  useEffect(() => {
    if (targetElement) {
      const attributes = extractElementAttributes(targetElement);
      const elementInfo = extractElementInfo(targetElement, metadata);

      actions.setAttributes(attributes);
      actions.setElementInfo(elementInfo);

      // 🎯 Type-safe logging avec analyse détaillée
      if (elementInfo) {
        console.log('🎯 Enhanced Element Analysis:', {
          id: elementInfo.id,
          componentType: elementInfo.componentType,
          nodeType: elementInfo.node?.componentType,
          classification: {
            isSwitch: elementTypePredicates.isSwitchElement(elementInfo),
            isFeeder: elementTypePredicates.isFeederElement(elementInfo),
            isBusbar: elementTypePredicates.isBusbarElement(elementInfo),
            isLine: elementTypePredicates.isLineElement(elementInfo),
            isBreaker: elementTypePredicates.isBreakerElement(elementInfo),
            isGenerator: elementTypePredicates.isGeneratorElement(elementInfo),
            isTransformer:
              elementTypePredicates.isTransformerElement(elementInfo),
            isUnknown: elementTypePredicates.isUnknownElement(elementInfo),
          },
          typeGuards: {
            isSwitchNode: isSwitchNode(elementInfo.node),
            isFeederNode: isFeederNode(elementInfo.node),
            isBusbarNode: isBusbarNode(elementInfo.node),
          },
          nodeProperties: elementInfo.node
            ? {
                equipmentId: elementInfo.node.equipmentId,
                vid: elementInfo.node.vid,
                open:
                  'open' in elementInfo.node ? elementInfo.node.open : 'N/A',
                nextVId:
                  'nextVId' in elementInfo.node
                    ? elementInfo.node.nextVId
                    : 'N/A',
                measurements:
                  'measurements' in elementInfo.node
                    ? !!elementInfo.node.measurements
                    : false,
              }
            : null,
        });
      }
    } else if (!state.contextMenuOpen) {
      actions.clearElementData();
    }
  }, [targetElement, metadata, state.contextMenuOpen, actions]);

  const handleContextMenuOpenChange = (open: boolean) => {
    actions.setContextMenuOpen(open);
    if (!open && !targetElement) {
      actions.clearElementData();
    }
  };

  return {
    elementInfo: state.elementInfo,
    attributes: state.attributes,
    contextMenuOpen: state.contextMenuOpen,
    handleContextMenuOpenChange,
    typePredicates: elementTypePredicates,
  };
};
