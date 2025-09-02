import React from 'react';
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import { ElementInfo } from '../types/element-info.type';
import { elementTypePredicates } from '../utils/element-type-predicates';
import { isBusbarNode, isFeederNode, isSwitchNode } from '@/types/component';

interface ElementContextMenuProps {
  elementInfo?: ElementInfo;
}

export const ElementContextMenu: React.FC<ElementContextMenuProps> = ({
  elementInfo,
}) => {
  if (!elementInfo) return null;

  // 🎯 Prédicats principaux - IMPÉRATIFS pour ce composant
  const isSwitch = elementTypePredicates.isSwitchElement(elementInfo);
  const isFeeder = elementTypePredicates.isFeederElement(elementInfo);
  const isBusbar = elementTypePredicates.isBusbarElement(elementInfo);
  const isUnknown = elementTypePredicates.isUnknownElement(elementInfo);

  // Prédicats spécifiques pour les actions détaillées
  const isBreaker = elementTypePredicates.isBreakerElement(elementInfo);
  const isLine = elementTypePredicates.isLineElement(elementInfo);
  const isGenerator = elementTypePredicates.isGeneratorElement(elementInfo);
  const isTransformer = elementTypePredicates.isTransformerElement(elementInfo);

  // 🎯 Type-safe node casting
  const switchNode = isSwitchNode(elementInfo.node) ? elementInfo.node : null;
  const feederNode = isFeederNode(elementInfo.node) ? elementInfo.node : null;
  const busbarNode = isBusbarNode(elementInfo.node) ? elementInfo.node : null;

  return (
    <ContextMenuContent className="w-64">
      {/* Header avec ID et type */}
      <div className="px-2 py-1 border-b">
        <div className="font-semibold">#{elementInfo.id}</div>
        <div className="text-xs text-gray-500">
          {elementInfo.componentType || 'UNKNOWN_TYPE'}
        </div>
      </div>

      {/* 🎯 Section SWITCH - Utilisation impérative de isSwitch */}
      {isSwitch && (
        <div className="px-2 py-1 text-sm bg-red-50">
          <div className="font-medium text-red-600">🔌 Switch Component</div>
          {switchNode && (
            <>
              <div className="text-gray-600">
                Status:{' '}
                <span
                  className={
                    switchNode.open ? 'text-red-500' : 'text-green-500'
                  }
                >
                  {switchNode.open ? 'Open' : 'Closed'}
                </span>
              </div>
              <div className="text-gray-600">
                Equipment: {switchNode.equipmentId}
              </div>
            </>
          )}
        </div>
      )}

      {/* 🎯 Section FEEDER - Utilisation impérative de isFeeder */}
      {isFeeder && (
        <div className="px-2 py-1 text-sm bg-blue-50">
          <div className="font-medium text-blue-600">⚡ Feeder Component</div>
          {feederNode && (
            <>
              <div className="text-gray-600">
                Equipment: {feederNode.equipmentId}
              </div>
              {feederNode.measurements && (
                <div className="text-gray-600 text-green-600">
                  📊 Measurements: Available
                </div>
              )}
              {feederNode.nextVId && (
                <div className="text-gray-600">
                  ➡️ Next: {feederNode.nextVId}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Section BUSBAR - Utilisation de isBusbar */}
      {isBusbar && (
        <div className="px-2 py-1 text-sm bg-green-50">
          <div className="font-medium text-green-600">🚌 Busbar Component</div>
          {busbarNode && (
            <>
              <div className="text-gray-600">VID: {busbarNode.vid}</div>
              <div className="text-gray-600">
                Equipment: {busbarNode.equipmentId}
              </div>
            </>
          )}
        </div>
      )}

      {/* Section UNKNOWN - Utilisation de isUnknown */}
      {isUnknown && (
        <div className="px-2 py-1 text-sm bg-yellow-50">
          <div className="font-medium text-yellow-600">
            ❓ Unknown Component
          </div>
          <div className="text-gray-600">
            Type: {elementInfo.node?.componentType || 'Undefined'}
          </div>
        </div>
      )}

      <ContextMenuSeparator />

      {/* 🎯 Actions SWITCH - Basées sur isSwitch */}
      {isSwitch && (
        <>
          <div className="px-2 py-1 text-xs font-medium text-red-500 uppercase">
            Switch Actions
          </div>

          {isBreaker && switchNode && (
            <ContextMenuItem className="text-red-600">
              🔧 {switchNode.open ? 'Close Breaker' : 'Open Breaker'}
            </ContextMenuItem>
          )}

          <ContextMenuItem>📊 View Switch Status</ContextMenuItem>

          <ContextMenuItem>⚙️ Switch Settings</ContextMenuItem>

          <ContextMenuSeparator />
        </>
      )}

      {/* 🎯 Actions FEEDER - Basées sur isFeeder */}
      {isFeeder && (
        <>
          <div className="px-2 py-1 text-xs font-medium text-blue-500 uppercase">
            Feeder Actions
          </div>

          {isLine && feederNode && (
            <>
              <ContextMenuItem className="text-blue-600">
                📏 View Line Parameters
              </ContextMenuItem>
              {feederNode.nextVId && (
                <ContextMenuItem className="text-blue-600">
                  🧭 Navigate to {feederNode.nextVId}
                </ContextMenuItem>
              )}
            </>
          )}

          {isGenerator && feederNode && (
            <>
              <ContextMenuItem className="text-green-600">
                🏭 Control Generation
              </ContextMenuItem>
              <ContextMenuItem className="text-green-600">
                📈 View Power Output
              </ContextMenuItem>
            </>
          )}

          {isTransformer && feederNode && (
            <>
              <ContextMenuItem className="text-purple-600">
                🔄 View Transformer Ratios
              </ContextMenuItem>
              <ContextMenuItem className="text-purple-600">
                ⚖️ Check Load Distribution
              </ContextMenuItem>
            </>
          )}

          <ContextMenuItem>📊 View Measurements</ContextMenuItem>

          <ContextMenuItem>📋 Feeder Properties</ContextMenuItem>

          <ContextMenuSeparator />
        </>
      )}

      {/* Actions BUSBAR */}
      {isBusbar && (
        <>
          <div className="px-2 py-1 text-xs font-medium text-green-500 uppercase">
            Busbar Actions
          </div>

          <ContextMenuItem className="text-green-600">
            📊 View Busbar Load
          </ContextMenuItem>

          <ContextMenuItem className="text-green-600">
            🔗 Show Connected Elements
          </ContextMenuItem>

          <ContextMenuItem>📋 Busbar Properties</ContextMenuItem>

          <ContextMenuSeparator />
        </>
      )}

      {/* Actions génériques - Toujours présentes */}
      <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase">
        General Actions
      </div>

      <ContextMenuItem>📋 Properties</ContextMenuItem>

      <ContextMenuItem>📋 Copy ID</ContextMenuItem>

      {/* Debug info en développement */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <ContextMenuSeparator />
          <div className="px-2 py-1 text-xs font-medium text-gray-400 uppercase">
            Debug Info
          </div>
          <ContextMenuItem disabled className="text-xs">
            Type: {elementInfo.componentType}
          </ContextMenuItem>
          <ContextMenuItem disabled className="text-xs">
            isSwitch: {isSwitch.toString()}
          </ContextMenuItem>
          <ContextMenuItem disabled className="text-xs">
            isFeeder: {isFeeder.toString()}
          </ContextMenuItem>
          <ContextMenuItem disabled className="text-xs">
            isBusbar: {isBusbar.toString()}
          </ContextMenuItem>
        </>
      )}
    </ContextMenuContent>
  );
};
