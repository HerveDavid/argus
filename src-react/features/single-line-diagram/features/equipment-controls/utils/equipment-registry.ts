// utils/equipmentRegistry.ts
import { EquipmentInfo, EquipmentAction } from '../types';
import { LucideIcon } from 'lucide-react';

export interface EquipmentTypeConfig {
  displayName: string;
  icon: LucideIcon;
  color: string;
  description: string;
  allowedActions: string[];
  customProperties?: Record<string, any>;
}

export interface EquipmentActionConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  requiresConfirmation?: boolean;
  permissions?: string[];
}

export class EquipmentTypeRegistry {
  private static instance: EquipmentTypeRegistry;
  private equipmentTypes = new Map<string, EquipmentTypeConfig>();
  private equipmentActions = new Map<string, EquipmentActionConfig>();

  private constructor() {
    this.initializeDefaultTypes();
    this.initializeDefaultActions();
  }

  static getInstance(): EquipmentTypeRegistry {
    if (!EquipmentTypeRegistry.instance) {
      EquipmentTypeRegistry.instance = new EquipmentTypeRegistry();
    }
    return EquipmentTypeRegistry.instance;
  }

  private initializeDefaultTypes(): void {
    // Initialisation des types par défaut
    // Cette méthode peut être étendue pour charger la configuration depuis un fichier
    this.registerEquipmentType('BREAKER', {
      displayName: 'Circuit Breaker',
      icon: require('lucide-react').Zap,
      color: '#3b82f6',
      description: 'Protective switching device',
      allowedActions: ['toggle', 'inspect', 'maintenance'],
      customProperties: {
        hasStates: true,
        states: ['open', 'closed'],
      },
    });

    this.registerEquipmentType('LINE', {
      displayName: 'Transmission Line',
      icon: require('lucide-react').ArrowRight,
      color: '#6b7280',
      description: 'Power transmission line',
      allowedActions: ['navigate', 'inspect', 'trace'],
      customProperties: {
        hasNavigation: true,
      },
    });

    this.registerEquipmentType('TRANSFORMER', {
      displayName: 'Transformer',
      icon: require('lucide-react').Zap,
      color: '#10b981',
      description: 'Power transformer',
      allowedActions: ['inspect', 'settings', 'maintenance'],
    });
  }

  private initializeDefaultActions(): void {
    // Initialisation des actions par défaut
    this.registerEquipmentAction('toggle', {
      id: 'toggle',
      label: 'Toggle State',
      icon: require('lucide-react').Power,
      description: 'Toggle equipment state',
      requiresConfirmation: true,
      permissions: ['operator'],
    });

    this.registerEquipmentAction('inspect', {
      id: 'inspect',
      label: 'Inspect',
      icon: require('lucide-react').Search,
      description: 'Inspect equipment details',
      permissions: ['viewer', 'operator'],
    });

    this.registerEquipmentAction('navigate', {
      id: 'navigate',
      label: 'Navigate',
      icon: require('lucide-react').ArrowRight,
      description: 'Navigate to connected equipment',
      permissions: ['viewer', 'operator'],
    });
  }

  registerEquipmentType(type: string, config: EquipmentTypeConfig): void {
    this.equipmentTypes.set(type, config);
  }

  registerEquipmentAction(actionId: string, config: EquipmentActionConfig): void {
    this.equipmentActions.set(actionId, config);
  }

  getEquipmentTypeConfig(type: string): EquipmentTypeConfig | undefined {
    return this.equipmentTypes.get(type);
  }

  getEquipmentActionConfig(actionId: string): EquipmentActionConfig | undefined {
    return this.equipmentActions.get(actionId);
  }

  getAllowedActionsForType(type: string): string[] {
    const config = this.getEquipmentTypeConfig(type);
    return config?.allowedActions || [];
  }

  getAvailableTypesForComponent(componentType: string): string[] {
    return Array.from(this.equipmentTypes.keys()).filter(type => 
      type === componentType || this.equipmentTypes.get(type)?.customProperties?.aliases?.includes(componentType)
    );
  }

  createActionsForEquipment(
    info: EquipmentInfo, 
    userPermissions: string[] = ['viewer']
  ): EquipmentAction[] {
    const allowedActions = this.getAllowedActionsForType(info.componentType || 'GENERIC');
    const actions: EquipmentAction[] = [];

    for (const actionId of allowedActions) {
      const actionConfig = this.getEquipmentActionConfig(actionId);
      if (actionConfig && this.hasPermission(actionConfig.permissions || [], userPermissions)) {
        actions.push({
          id: actionConfig.id,
          label: actionConfig.label,
          icon: actionConfig.icon,
          onClick: () => this.executeAction(actionId, info),
          variant: actionConfig.requiresConfirmation ? 'destructive' : 'default',
        });
      }
    }

    return actions;
  }

  private hasPermission(requiredPermissions: string[], userPermissions: string[]): boolean {
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  }

  private executeAction(actionId: string, info: EquipmentInfo): void {
    // Logique d'exécution des actions
    // Cette méthode peut être étendue pour inclure la logique métier
    console.log(`Executing action ${actionId} on equipment ${info.id}`);
  }
}