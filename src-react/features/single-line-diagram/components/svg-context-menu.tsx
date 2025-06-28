import { useEffect, useState } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Badge } from '@/components/ui/badge';
import { Copy, Hash, FileText, Power, PowerOff, Zap } from 'lucide-react';

interface SVGContextMenuProps {
  children: React.ReactNode;
  targetElement: SVGElement | null;
  onToggleBreaker?: (breakerId: string, isClosed: boolean) => void;
}

export const SVGContextMenu: React.FC<SVGContextMenuProps> = ({
  children,
  targetElement,
  onToggleBreaker,
}) => {
  const [attributes, setAttributes] = useState<
    { name: string; value: string }[]
  >([]);
  const [elementInfo, setElementInfo] = useState<{
    tagName: string;
    id: string;
    classes: string[];
    isLabel: boolean;
    text: string;
    isBreaker: boolean;
    isClosed: boolean;
  }>({
    tagName: '',
    id: '',
    classes: [],
    isLabel: false,
    text: '',
    isBreaker: false,
    isClosed: false,
  });

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
      const classList = targetElement.getAttribute('class')?.split(' ') || [];
      const isLabel = classList.includes('sld-label');
      const isBreaker = classList.includes('sld-breaker');
      const isClosed = classList.includes('sld-closed');
      const text = targetElement.textContent || '';

      setElementInfo({
        tagName,
        id,
        classes: classList,
        isLabel,
        text,
        isBreaker,
        isClosed,
      });
    }
  }, [targetElement]);

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
    if (elementInfo.id) {
      navigator.clipboard.writeText(elementInfo.id);
    }
  };

  const handleCopyText = () => {
    if (elementInfo.text) {
      navigator.clipboard.writeText(elementInfo.text);
    }
  };

  const handleToggleBreaker = () => {
    if (elementInfo.isBreaker && targetElement && onToggleBreaker) {
      onToggleBreaker(elementInfo.id, elementInfo.isClosed);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent
        className="w-80"
        style={{
          backgroundColor: 'var(--popover)',
          color: 'var(--popover-foreground)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header with element info */}
        <div
          className="px-2 py-2 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="font-semibold text-sm"
              style={{ color: 'var(--primary)' }}
            >
              {elementInfo.tagName}
            </span>
            {elementInfo.id && (
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--muted-foreground)',
                  backgroundColor: 'var(--background)',
                }}
              >
                #{elementInfo.id}
              </Badge>
            )}
          </div>

          {/* Classes */}
          {elementInfo.classes.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {elementInfo.classes.map((cls, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: 'var(--secondary)',
                    color: 'var(--secondary-foreground)',
                  }}
                >
                  {cls}
                </Badge>
              ))}
            </div>
          )}

          {/* Text for labels */}
          {elementInfo.isLabel && elementInfo.text && (
            <div
              className="text-sm italic truncate"
              style={{ color: 'var(--muted-foreground)' }}
            >
              "{elementInfo.text}"
            </div>
          )}
        </div>

        {/* Breaker actions */}
        {elementInfo.isBreaker && (
          <>
            <ContextMenuItem
              onClick={handleToggleBreaker}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--foreground)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--accent-foreground)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--foreground)';
              }}
            >
              {elementInfo.isClosed ? (
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
            <ContextMenuSeparator
              style={{ backgroundColor: 'var(--border)' }}
            />
          </>
        )}

        {/* Copy actions */}
        <ContextMenuItem
          onClick={handleCopyElementInfo}
          style={{
            backgroundColor: 'transparent',
            color: 'var(--foreground)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent)';
            e.currentTarget.style.color = 'var(--accent-foreground)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--foreground)';
          }}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy entire element
        </ContextMenuItem>

        {elementInfo.id && (
          <ContextMenuItem
            onClick={handleCopyId}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--foreground)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--accent-foreground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--foreground)';
            }}
          >
            <Hash className="mr-2 h-4 w-4" />
            Copy ID
          </ContextMenuItem>
        )}

        {elementInfo.isLabel && elementInfo.text && (
          <ContextMenuItem
            onClick={handleCopyText}
            style={{
              backgroundColor: 'transparent',
              color: 'var(--foreground)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--accent-foreground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--foreground)';
            }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Copy text
          </ContextMenuItem>
        )}

        {/* Attributes submenu */}
        {attributes.length > 0 && (
          <>
            <ContextMenuSeparator
              style={{ backgroundColor: 'var(--border)' }}
            />
            <ContextMenuSub>
              <ContextMenuSubTrigger
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--foreground)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent-foreground)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--foreground)';
                }}
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
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--foreground)',
                    }}
                    className="hover:bg-opacity-10"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--muted)';
                      e.currentTarget.style.color = 'var(--accent-foreground)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--foreground)';
                    }}
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
      </ContextMenuContent>
    </ContextMenu>
  );
};
