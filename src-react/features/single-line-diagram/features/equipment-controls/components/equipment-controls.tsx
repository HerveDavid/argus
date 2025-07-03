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
import {
  Copy,
  Hash,
  FileText,
  Power,
  PowerOff,
  Zap,
  Info,
  ArrowRight,
} from 'lucide-react';
import {
  SWITCH_COMPONENT_TYPES,
  FEEDER_COMPONENT_TYPES,
  BUSBAR_SECTION_TYPES,
  SldMetadata,
  Node,
} from '@/types/sld-metadata'; // Importez vos types

interface EquipmentControlsProps {
  children: React.ReactNode;
  targetElement: SVGElement | null;
  metadata?: SldMetadata; // Ajoutez les métadonnées
  onToggleBreaker?: (breakerId: string, isClosed: boolean) => void;
  onGoToVoltageLevel?: (nextVId: string) => void; // Nouvelle callback pour la navigation
}

export const EquipmentControls: React.FC<EquipmentControlsProps> = ({
  children,
  targetElement,
  metadata,
  onToggleBreaker,
  onGoToVoltageLevel,
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
    componentType: string | null;
    equipmentId: string | null;
    nodeInfo: Node | null;
    isLine: boolean;
    nextVId: string | null;
  }>({
    tagName: '',
    id: '',
    classes: [],
    isLabel: false,
    text: '',
    isBreaker: false,
    isClosed: false,
    componentType: null,
    equipmentId: null,
    nodeInfo: null,
    isLine: false,
    nextVId: null,
  });

  // Fonction pour déterminer le type de composant à partir des classes CSS
  const getComponentTypeFromClasses = (classList: string[]): string | null => {
    // Recherche dans les classes CSS
    for (const cls of classList) {
      if (cls.startsWith('sld-')) {
        const potentialType = cls.replace('sld-', '').toUpperCase();

        // Vérifiez contre les types connus
        if (SWITCH_COMPONENT_TYPES.has(potentialType)) {
          return potentialType;
        }
        if (FEEDER_COMPONENT_TYPES.has(potentialType)) {
          return potentialType;
        }
        if (BUSBAR_SECTION_TYPES.has(potentialType)) {
          return potentialType;
        }

        // Types spéciaux
        if (potentialType === 'LABEL') return 'LABEL';
        if (potentialType === 'WIRE' || potentialType === 'LINE') return 'WIRE';
        if (potentialType === 'BUS') return 'BUS';
        if (potentialType === 'VOLTAGE_LEVEL') return 'VOLTAGE_LEVEL';
      }
    }
    return null;
  };

  // Fonction pour trouver les informations du nœud dans les métadonnées
  const findNodeInfo = (
    elementId: string,
    metadata?: SldMetadata,
  ): Node | null => {
    if (!metadata || !elementId) return null;

    return (
      metadata.nodes.find(
        (node) => node.id === elementId || node.equipmentId === elementId,
      ) || null
    );
  };

  // Fonction pour extraire l'equipment ID à partir de l'ID de l'élément
  const extractEquipmentId = (
    elementId: string,
    classList: string[],
  ): string | null => {
    // Parfois l'equipment ID est directement l'ID de l'élément
    if (elementId && !elementId.includes('_')) {
      return elementId;
    }

    // Parfois il faut extraire à partir d'un pattern comme "EQUIPMENT_ID_suffix"
    if (elementId && elementId.includes('_')) {
      const parts = elementId.split('_');
      if (parts.length > 1) {
        return parts[0];
      }
    }

    // Chercher dans les attributs data-* ou d'autres patterns
    return null;
  };

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

      // Déterminer le type de composant
      const componentType = getComponentTypeFromClasses(classList);

      // Extraire l'equipment ID
      const equipmentId = extractEquipmentId(id, classList);

      // Trouver les informations du nœud dans les métadonnées
      const nodeInfo =
        findNodeInfo(id, metadata) || findNodeInfo(equipmentId || '', metadata);

      // Vérifier si c'est une ligne et récupérer le nextVId
      const isLine =
        nodeInfo?.componentType === 'LINE' || componentType === 'LINE';
      const nextVId = nodeInfo?.nextVId || null;

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
      });
    }
  }, [targetElement, metadata]);

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

  const handleCopyType = () => {
    if (elementInfo.componentType) {
      navigator.clipboard.writeText(elementInfo.componentType);
    }
  };

  const handleCopyEquipmentId = () => {
    if (elementInfo.equipmentId) {
      navigator.clipboard.writeText(elementInfo.equipmentId);
    }
  };

  const handleCopyNextVId = () => {
    if (elementInfo.nextVId) {
      navigator.clipboard.writeText(elementInfo.nextVId);
    }
  };

  const handleToggleBreaker = () => {
    if (elementInfo.isBreaker && targetElement && onToggleBreaker) {
      onToggleBreaker(elementInfo.id, elementInfo.isClosed);
    }
  };

  const handleGoToVoltageLevel = () => {
    if (elementInfo.isLine && elementInfo.nextVId && onGoToVoltageLevel) {
      onGoToVoltageLevel(elementInfo.nextVId);
    }
  };

  const getTypeColor = (type: string | null): string => {
    if (!type) return 'var(--muted-foreground)';

    if (SWITCH_COMPONENT_TYPES.has(type)) return '#3b82f6'; // blue
    if (FEEDER_COMPONENT_TYPES.has(type)) return '#10b981'; // green
    if (BUSBAR_SECTION_TYPES.has(type)) return '#f59e0b'; // yellow
    if (type === 'WIRE' || type === 'LINE') return '#6b7280'; // gray
    if (type === 'BUS') return '#8b5cf6'; // purple

    return 'var(--muted-foreground)';
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

          {/* Component Type */}
          {elementInfo.componentType && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium">Type:</span>
              <Badge
                variant="outline"
                className="text-xs font-mono"
                style={{
                  borderColor: getTypeColor(elementInfo.componentType),
                  color: getTypeColor(elementInfo.componentType),
                  backgroundColor: 'var(--background)',
                }}
              >
                {elementInfo.componentType}
              </Badge>
            </div>
          )}

          {/* Equipment ID */}
          {elementInfo.equipmentId &&
            elementInfo.equipmentId !== elementInfo.id && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium">Equipment:</span>
                <Badge
                  variant="secondary"
                  className="text-xs font-mono"
                  style={{
                    backgroundColor: 'var(--secondary)',
                    color: 'var(--secondary-foreground)',
                  }}
                >
                  {elementInfo.equipmentId}
                </Badge>
              </div>
            )}

          {/* Next Voltage Level pour les lignes */}
          {elementInfo.isLine && elementInfo.nextVId && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium">Next Level:</span>
              <Badge
                variant="outline"
                className="text-xs font-mono"
                style={{
                  borderColor: '#10b981',
                  color: '#10b981',
                  backgroundColor: 'var(--background)',
                }}
              >
                {elementInfo.nextVId}
              </Badge>
            </div>
          )}

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

        {/* Line navigation actions */}
        {elementInfo.isLine && elementInfo.nextVId && (
          <>
            <ContextMenuItem
              onClick={handleGoToVoltageLevel}
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
              <ArrowRight className="mr-2 h-4 w-4" />
              Go to {elementInfo.nextVId}
            </ContextMenuItem>
            <ContextMenuSeparator
              style={{ backgroundColor: 'var(--border)' }}
            />
          </>
        )}

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

        {elementInfo.componentType && (
          <ContextMenuItem
            onClick={handleCopyType}
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
            <Info className="mr-2 h-4 w-4" />
            Copy type
          </ContextMenuItem>
        )}

        {elementInfo.equipmentId && (
          <ContextMenuItem
            onClick={handleCopyEquipmentId}
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
            Copy equipment ID
          </ContextMenuItem>
        )}

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

        {elementInfo.isLine && elementInfo.nextVId && (
          <ContextMenuItem
            onClick={handleCopyNextVId}
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
            <ArrowRight className="mr-2 h-4 w-4" />
            Copy next voltage level
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
