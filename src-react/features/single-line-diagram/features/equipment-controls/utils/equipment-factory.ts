// utils/equipmentFactory.ts
import { EquipmentInfo, EquipmentAction } from '../types';
import {
  ArrowRight,
  Power,
  PowerOff,
  Settings,
  Zap,
  Info,
  FileText,
} from 'lucide-react';

export class EquipmentActionFactory {
  static createActionsForEquipment(
    info: EquipmentInfo,
    handlers: {
      onToggleBreaker?: (id: string, isClosed: boolean) => void;
      onGoToVoltageLevel?: (nextVId: string) => void;
      onShowSettings?: (equipmentId: string) => void;
      onShowAnalytics?: (equipmentId: string) => void;
    },
  ): EquipmentAction[] {
    const actions: EquipmentAction[] = [];

    switch (info.type) {
      case 'breaker':
        actions.push({
          id: 'toggle-breaker',
          label: info.isClosed ? 'Open breaker' : 'Close breaker',
          icon: info.isClosed ? Power : PowerOff,
          onClick: () => handlers.onToggleBreaker?.(info.id, info.isClosed),
          variant: info.isClosed ? 'destructive' : 'default',
        });
        break;

      case 'line':
        actions.push({
          id: 'navigate-line',
          label: `Go to ${info.nextVId}`,
          icon: ArrowRight,
          onClick: () => handlers.onGoToVoltageLevel?.(info.nextVId),
        });
        break;

      case 'label':
        actions.push({
          id: 'edit-label',
          label: 'Edit text',
          icon: FileText,
          onClick: () => console.log('Edit label:', info.text),
        });
        break;

      case 'generic':
        // Actions communes pour les équipements génériques
        if (info.equipmentId) {
          actions.push({
            id: 'show-settings',
            label: 'Settings',
            icon: Settings,
            onClick: () => handlers.onShowSettings?.(info.equipmentId!),
          });

          actions.push({
            id: 'show-analytics',
            label: 'Analytics',
            icon: Zap,
            onClick: () => handlers.onShowAnalytics?.(info.equipmentId!),
          });
        }
        break;
    }

    return actions;
  }

  static createCopyActionsForEquipment(info: EquipmentInfo): EquipmentAction[] {
    const actions: EquipmentAction[] = [];

    // Actions de copie communes
    if (info.id) {
      actions.push({
        id: 'copy-id',
        label: 'Copy ID',
        icon: Info,
        onClick: () => navigator.clipboard.writeText(info.id),
      });
    }

    if (info.componentType) {
      actions.push({
        id: 'copy-type',
        label: 'Copy type',
        icon: Info,
        onClick: () => navigator.clipboard.writeText(info.componentType!),
      });
    }

    if (info.equipmentId) {
      actions.push({
        id: 'copy-equipment-id',
        label: 'Copy equipment ID',
        icon: Info,
        onClick: () => navigator.clipboard.writeText(info.equipmentId!),
      });
    }

    // Actions spécifiques par type
    switch (info.type) {
      case 'line':
        actions.push({
          id: 'copy-next-vid',
          label: 'Copy next voltage level',
          icon: ArrowRight,
          onClick: () => navigator.clipboard.writeText(info.nextVId),
        });
        break;

      case 'label':
        if (info.text) {
          actions.push({
            id: 'copy-text',
            label: 'Copy text',
            icon: FileText,
            onClick: () => navigator.clipboard.writeText(info.text),
          });
        }
        break;
    }

    return actions;
  }
}
