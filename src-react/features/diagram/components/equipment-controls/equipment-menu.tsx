import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  ArrowRight,
  FileText,
  Hash,
  Info,
  Power,
  PowerOff,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  BUSBAR_SECTION_TYPES,
  FEEDER_COMPONENT_TYPES,
  SWITCH_COMPONENT_TYPES,
  MeasurementType,
} from '@/types/sld-metadata';
import { ElementInfo } from '../../types/element-info.type';

type EquipmentMenuProps = {
  elementInfo: ElementInfo;
  onToggleBreaker?: (breakerId: string, isClosed: boolean) => void;
  onGoToVoltageLevel?: (nextVId: string) => void;
  onCopyAttribute?: (name: string, value: string) => void;
  attributes?: { name: string; value: string }[];
};

export const EquipmentMenu: React.FC<EquipmentMenuProps> = ({
  elementInfo,
  onToggleBreaker,
  onGoToVoltageLevel,
  onCopyAttribute,
  attributes = [],
}) => {
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

  const handleCopyMeasurementType = () => {
    if (elementInfo.measurementType) {
      navigator.clipboard.writeText(elementInfo.measurementType);
    }
  };

  const handleCopyMeasurementValue = () => {
    if (elementInfo.measurementValue) {
      navigator.clipboard.writeText(elementInfo.measurementValue);
    }
  };

  const handleCopyEquipmentId = () => {
    if (elementInfo.equipmentId) {
      navigator.clipboard.writeText(elementInfo.equipmentId);
    }
  };

  const handleCopyParentEquipmentId = () => {
    if (elementInfo.parentEquipmentId) {
      navigator.clipboard.writeText(elementInfo.parentEquipmentId);
    }
  };

  const handleCopyNextVId = () => {
    if (elementInfo.nextVId) {
      navigator.clipboard.writeText(elementInfo.nextVId);
    }
  };

  const handleToggleBreaker = () => {
    if (elementInfo.isBreaker && onToggleBreaker) {
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

  const getMeasurementTypeColor = (type: MeasurementType | null): string => {
    if (!type) return 'var(--muted-foreground)';

    switch (type) {
      case 'ACTIVE_POWER':
        return '#dc2626'; // red
      case 'REACTIVE_POWER':
        return '#ca8a04'; // yellow-600
      case 'CURRENT':
        return '#2563eb'; // blue-600
      case 'VOLTAGE':
        return '#059669'; // emerald-600
      case 'ANGLE':
        return '#7c3aed'; // violet-600
      default:
        return 'var(--muted-foreground)';
    }
  };

  const getMeasurementIcon = (type: MeasurementType | null) => {
    switch (type) {
      case 'ACTIVE_POWER':
      case 'REACTIVE_POWER':
        return TrendingUp;
      case 'CURRENT':
      case 'VOLTAGE':
      case 'ANGLE':
        return Activity;
      default:
        return Info;
    }
  };

  return (
    <div
      className="bg-popover text-popover-foreground border-border w-80 rounded-md border shadow-lg"
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
        className="border-b px-2 py-2"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span
            className="text-sm font-semibold"
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

        {/* Measurement Type */}
        {elementInfo.isMeasurement && elementInfo.measurementType && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-medium">Measurement:</span>
            <Badge
              variant="outline"
              className="font-mono text-xs"
              style={{
                borderColor: getMeasurementTypeColor(
                  elementInfo.measurementType,
                ),
                color: getMeasurementTypeColor(elementInfo.measurementType),
                backgroundColor: 'var(--background)',
              }}
            >
              {elementInfo.measurementType}
            </Badge>
          </div>
        )}

        {/* Measurement Value */}
        {elementInfo.isMeasurement && elementInfo.measurementValue && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-medium">Value:</span>
            <Badge
              variant="secondary"
              className="font-mono text-xs"
              style={{
                backgroundColor: 'var(--secondary)',
                color: 'var(--secondary-foreground)',
              }}
            >
              {elementInfo.measurementValue}
            </Badge>
          </div>
        )}

        {/* Component Type */}
        {elementInfo.componentType && !elementInfo.isMeasurement && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-medium">Type:</span>
            <Badge
              variant="outline"
              className="font-mono text-xs"
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
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-medium">Equipment:</span>
              <Badge
                variant="secondary"
                className="font-mono text-xs"
                style={{
                  backgroundColor: 'var(--secondary)',
                  color: 'var(--secondary-foreground)',
                }}
              >
                {elementInfo.equipmentId}
              </Badge>
            </div>
          )}

        {/* Parent Equipment ID pour les mesures */}
        {elementInfo.isMeasurement &&
          elementInfo.parentEquipmentId &&
          elementInfo.parentEquipmentId !== elementInfo.equipmentId && (
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-medium">Parent Equipment:</span>
              <Badge
                variant="outline"
                className="font-mono text-xs"
                style={{
                  borderColor: '#6b7280',
                  color: '#6b7280',
                  backgroundColor: 'var(--background)',
                }}
              >
                {elementInfo.parentEquipmentId}
              </Badge>
            </div>
          )}

        {/* Next Voltage Level pour les lignes */}
        {elementInfo.isLine && elementInfo.nextVId && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-medium">Next Level:</span>
            <Badge
              variant="outline"
              className="font-mono text-xs"
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
          <div className="mb-2 flex flex-wrap gap-1">
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
            className="truncate text-sm italic"
            style={{ color: 'var(--muted-foreground)' }}
          >
            "{elementInfo.text}"
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="py-2">
        {/* Line navigation actions */}
        {elementInfo.isLine && elementInfo.nextVId && (
          <div
            className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center px-4 py-2"
            onClick={handleGoToVoltageLevel}
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Go to {elementInfo.nextVId}
          </div>
        )}

        {/* Breaker actions */}
        {elementInfo.isBreaker && (
          <div
            className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center px-4 py-2"
            onClick={handleToggleBreaker}
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
          </div>
        )}

        {/* Separator if actions exist */}
        {((elementInfo.isLine && elementInfo.nextVId) ||
          elementInfo.isBreaker) && (
          <div className="border-t" style={{ borderColor: 'var(--border)' }} />
        )}

        {/* Copy actions */}
        <div className="py-1">
          {/* Copy measurement type */}
          {elementInfo.isMeasurement && elementInfo.measurementType && (
            <div
              className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center px-4 py-2"
              onClick={handleCopyMeasurementType}
            >
              {(() => {
                const IconComponent = getMeasurementIcon(
                  elementInfo.measurementType,
                );
                return <IconComponent className="mr-2 h-4 w-4" />;
              })()}
              Copy measurement type
            </div>
          )}

          {/* Copy measurement value */}
          {elementInfo.isMeasurement && elementInfo.measurementValue && (
            <div
              className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center px-4 py-2"
              onClick={handleCopyMeasurementValue}
            >
              <Hash className="mr-2 h-4 w-4" />
              Copy measurement value
            </div>
          )}

          {elementInfo.componentType && !elementInfo.isMeasurement && (
            <div
              className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center px-4 py-2"
              onClick={handleCopyType}
            >
              <Info className="mr-2 h-4 w-4" />
              Copy type
            </div>
          )}

          {elementInfo.equipmentId && (
            <div
              className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center px-4 py-2"
              onClick={handleCopyEquipmentId}
            >
              <Hash className="mr-2 h-4 w-4" />
              Copy equipment ID
            </div>
          )}

          {/* Copy parent equipment ID pour les mesures */}
          {elementInfo.isMeasurement &&
            elementInfo.parentEquipmentId &&
            elementInfo.parentEquipmentId !== elementInfo.equipmentId && (
              <div
                className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center px-4 py-2"
                onClick={handleCopyParentEquipmentId}
              >
                <Hash className="mr-2 h-4 w-4" />
                Copy parent equipment ID
              </div>
            )}

          {elementInfo.id && (
            <div
              className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center px-4 py-2"
              onClick={handleCopyId}
            >
              <Hash className="mr-2 h-4 w-4" />
              Copy ID
            </div>
          )}

          {elementInfo.isLine && elementInfo.nextVId && (
            <div
              className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center px-4 py-2"
              onClick={handleCopyNextVId}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Copy next voltage level
            </div>
          )}

          {elementInfo.isLabel && elementInfo.text && (
            <div
              className="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center px-4 py-2"
              onClick={handleCopyText}
            >
              <FileText className="mr-2 h-4 w-4" />
              Copy text
            </div>
          )}
        </div>

        {/* Attributes section */}
        {attributes.length > 0 && (
          <>
            <div
              className="border-t"
              style={{ borderColor: 'var(--border)' }}
            />
            <div className="px-4 py-2">
              <div className="mb-2 flex items-center">
                <Zap className="mr-2 h-4 w-4" />
                <span className="font-medium">
                  Attributes ({attributes.length})
                </span>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {attributes.map((attr, index) => (
                  <div
                    key={index}
                    className="hover:bg-muted cursor-pointer rounded px-2 py-1"
                    onClick={() => onCopyAttribute?.(attr.name, attr.value)}
                  >
                    <div className="flex flex-col">
                      <span
                        className="text-sm font-medium"
                        style={{ color: 'var(--primary)' }}
                      >
                        {attr.name}
                      </span>
                      <span
                        className="truncate text-xs"
                        style={{ color: 'var(--muted-foreground)' }}
                      >
                        {attr.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
