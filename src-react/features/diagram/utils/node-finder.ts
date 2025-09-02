import { SldMetadata, Node } from '@/types/sld-metadata';
import {
  extractEquipmentId,
  extractParentEquipmentId,
  findNodeInfo,
} from '../utils/element-getters';

export interface NodeSearchResult {
  node: Node | null;
  searchStrategy: 'direct' | 'equipment' | 'parent' | 'fallback';
}

export const findBestMatchingNode = (
  id: string,
  equipmentId: string | null,
  parentEquipmentId: string | null,
  metadata?: SldMetadata,
): NodeSearchResult => {
  // Stratégie 1: Recherche directe par ID
  let node = findNodeInfo(id, metadata);
  if (node) {
    return { node, searchStrategy: 'direct' };
  }

  // Stratégie 2: Recherche par equipment ID
  if (equipmentId) {
    node = findNodeInfo(equipmentId, metadata);
    if (node) {
      return { node, searchStrategy: 'equipment' };
    }
  }

  // Stratégie 3: Recherche par parent equipment ID (pour les mesures)
  if (parentEquipmentId) {
    node = findNodeInfo(parentEquipmentId, metadata);
    if (node) {
      return { node, searchStrategy: 'parent' };
    }
  }

  return { node: null, searchStrategy: 'fallback' };
};
