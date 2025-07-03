// components/EquipmentCopyActions.tsx
import React from 'react';
import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import {
  Copy,
  Hash,
  FileText,
  Info,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { EquipmentCopyActionsProps } from '../types';

export const EquipmentCopyActions: React.FC<EquipmentCopyActionsProps> = ({
  info,
  attributes,
  targetElement,
}) => {
  const handleCopyAttribute = (name: string, value: string) => {
    navigator.clipboard.writeText(`${name}="${value}"`);
  };

  const handleCopyElementInfo = () => {
    if (!targetElement) return;

    const tagName = targetElement.tagName;
    let attributesText = '';

    attributes.forEach((attr) => {
      attributesText += ` ${attr.name}="${attr.value}"`;
    });

    navigator.clipboard.writeText(`<${tagName}${attributesText} />`);
  };

  const handleCopyId = () => {
    if (info.id) {
      navigator.clipboard.writeText(info.id);
    }
  };

  const handleCopyText = () => {
    if (info.text) {
      navigator.clipboard.writeText(info.text);
    }
  };

  const handleCopyType = () => {
    if (info.componentType) {
      navigator.clipboard.writeText(info.componentType);
    }
  };

  const handleCopyEquipmentId = () => {
    if (info.equipmentId) {
      navigator.clipboard.writeText(info.equipmentId);
    }
  };

  const handleCopyNextVId = () => {
    if (info.type === 'line') {
      navigator.clipboard.writeText(info.nextVId);
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

  const subMenuHoverHandlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.backgroundColor = 'var(--muted)';
      e.currentTarget.style.color = 'var(--accent-foreground)';
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = 'var(--foreground)';
    },
  };

  return (
    <>
      {/* Copy actions */}
      <ContextMenuItem
        onClick={handleCopyElementInfo}
        style={menuItemStyle}
        {...menuItemHoverHandlers}
      >
        <Copy className="mr-2 h-4 w-4" />
        Copy entire element
      </ContextMenuItem>

      {info.componentType && (
        <ContextMenuItem
          onClick={handleCopyType}
          style={menuItemStyle}
          {...menuItemHoverHandlers}
        >
          <Info className="mr-2 h-4 w-4" />
          Copy type
        </ContextMenuItem>
      )}

      {info.equipmentId && (
        <ContextMenuItem
          onClick={handleCopyEquipmentId}
          style={menuItemStyle}
          {...menuItemHoverHandlers}
        >
          <Hash className="mr-2 h-4 w-4" />
          Copy equipment ID
        </ContextMenuItem>
      )}

      {info.id && (
        <ContextMenuItem
          onClick={handleCopyId}
          style={menuItemStyle}
          {...menuItemHoverHandlers}
        >
          <Hash className="mr-2 h-4 w-4" />
          Copy ID
        </ContextMenuItem>
      )}

      {info.type === 'line' && (
        <ContextMenuItem
          onClick={handleCopyNextVId}
          style={menuItemStyle}
          {...menuItemHoverHandlers}
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Copy next voltage level
        </ContextMenuItem>
      )}

      {info.type === 'label' && info.text && (
        <ContextMenuItem
          onClick={handleCopyText}
          style={menuItemStyle}
          {...menuItemHoverHandlers}
        >
          <FileText className="mr-2 h-4 w-4" />
          Copy text
        </ContextMenuItem>
      )}

      {/* Attributes submenu */}
      {attributes.length > 0 && (
        <>
          <ContextMenuSeparator style={{ backgroundColor: 'var(--border)' }} />
          <ContextMenuSub>
            <ContextMenuSubTrigger
              style={menuItemStyle}
              {...menuItemHoverHandlers}
            >
              <Zap className="mr-2 h-4 w-4" />
              Attributes ({attributes.length})
            </ContextMenuSubTrigger>
            <ContextMenuSubContent
              className="w-72"
              style={{
                backgroundColor: 'var(--popover)',
                color: 'var(--popover-foreground)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {attributes.map((attr, index) => (
                <ContextMenuItem
                  key={index}
                  onClick={() => handleCopyAttribute(attr.name, attr.value)}
                  style={menuItemStyle}
                  className="hover:bg-opacity-10"
                  {...subMenuHoverHandlers}
                >
                  <div className="flex flex-col items-start">
                    <span
                      className="font-medium"
                      style={{ color: 'var(--primary)' }}
                    >
                      {attr.name}
                    </span>
                    <span
                      className="text-xs truncate max-w-full"
                      style={{ color: 'var(--muted-foreground)' }}
                    >
                      {attr.value}
                    </span>
                  </div>
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        </>
      )}
    </>
  );
};