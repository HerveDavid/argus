import { useCallback } from 'react';
import { ElementInfo } from '../types/element-info.type';
import {
  elementTypePredicates,
  isLineNode,
} from '../utils/element-type-predicates';

export const useElementActions = (elementInfo?: ElementInfo) => {
  // 🎯 Actions spécifiques aux types
  const toggleBreaker = useCallback(() => {
    if (elementInfo && elementTypePredicates.isBreakerElement(elementInfo)) {
      console.log(`Toggling breaker ${elementInfo.id}`);
      // Implémentation du toggle
    }
  }, [elementInfo]);

  const navigateToNextNode = useCallback(() => {
    if (
      elementInfo &&
      isLineNode(elementInfo.node) &&
      elementInfo.node.nextVId
    ) {
      console.log(`Navigating to ${elementInfo.node.nextVId}`);
      // Implémentation de la navigation
    }
  }, [elementInfo]);

  const viewMeasurementHistory = useCallback(() => {
    if (
      elementInfo &&
      elementTypePredicates.isMeasurementElement(elementInfo)
    ) {
      console.log(`Viewing measurement history for ${elementInfo.id}`);
      // Implémentation de l'historique
    }
  }, [elementInfo]);

  const controlGenerator = useCallback(() => {
    if (elementInfo && elementTypePredicates.isGeneratorElement(elementInfo)) {
      console.log(`Controlling generator ${elementInfo.id}`);
      // Implémentation du contrôle générateur
    }
  }, [elementInfo]);

  return {
    toggleBreaker,
    navigateToNextNode,
    viewMeasurementHistory,
    controlGenerator,
    // Type guards pour vérifier les actions disponibles
    canToggleBreaker: elementInfo
      ? elementTypePredicates.isBreakerElement(elementInfo)
      : false,
    canNavigate: elementInfo
      ? isLineNode(elementInfo.node) && !!elementInfo.node?.nextVId
      : false,
    canViewHistory: elementInfo
      ? elementTypePredicates.isMeasurementElement(elementInfo)
      : false,
    canControlGenerator: elementInfo
      ? elementTypePredicates.isGeneratorElement(elementInfo)
      : false,
  };
};
