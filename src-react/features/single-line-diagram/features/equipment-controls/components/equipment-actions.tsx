// components/EquipmentActions.tsx
import React from 'react';
import { ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu';
import { ArrowRight, Power, PowerOff } from 'lucide-react';
import { EquipmentActionsProps } from '../types';

export const EquipmentActions: React.FC<EquipmentActionsProps> = ({
  info,
  onToggleBreaker,
  onGoToVoltageLevel,
}) => {
  const handleToggleBreaker = () => {
    if (info.type === 'breaker' && onToggleBreaker) {
      onToggleBreaker(info.id, info.isClosed);
    }
  };

  const handleGoToVoltageLevel = () => {
    if (info.type === 'line' && onGoToVoltageLevel) {
      onGoToVoltageLevel(info.nextVId);
    }
  };

  const menuItemStyle = {
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
  };

  const menuItemHoverHandlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.backgroundColor = 'var(--accent)';
      e.currentTarget.style.color = 'var(--accent-foreground)';
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = 'var(--foreground)';
    },
  };

  const separatorStyle = { backgroundColor: 'var(--border)' };

  return (
    <>
      {/* Line navigation actions */}
      {info.type === 'line' && (
        <>
          <ContextMenuItem
            onClick={handleGoToVoltageLevel}
            style={menuItemStyle}
            {...menuItemHoverHandlers}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Go to {info.nextVId}
          </ContextMenuItem>
          <ContextMenuSeparator style={separatorStyle} />
        </>
      )}

      {/* Breaker actions */}
      {info.type === 'breaker' && (
        <>
          <ContextMenuItem
            onClick={handleToggleBreaker}
            style={menuItemStyle}
            {...menuItemHoverHandlers}
          >
            {info.isClosed ? (
              <>
                <Power className="mr-2 h-4 w-4" />
                Open breaker
              </>
            ) : (
              <>
                <PowerOff className="mr-2 h-4 w-4" />
                Close breaker
              </>
            )}
          </ContextMenuItem>
          <ContextMenuSeparator style={separatorStyle} />
        </>
      )}
    </>
  );
};