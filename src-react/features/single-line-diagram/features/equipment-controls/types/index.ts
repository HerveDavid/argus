import { SldMetadata, Node } from '@/types/sld-metadata';

export interface BaseEquipmentInfo {
  tagName: string;
  id: string;
  classes: string[];
  text: string;
  componentType: string | null;
  equipmentId: string | null;
  nodeInfo: Node | null;
}

export interface BreakerInfo extends BaseEquipmentInfo {
  type: 'breaker';
  isBreaker: true;
  isClosed: boolean;
}

export interface LineInfo extends BaseEquipmentInfo {
  type: 'line';
  isLine: true;
  nextVId: string;
}

export interface LabelInfo extends BaseEquipmentInfo {
  type: 'label';
  isLabel: true;
  text: string;
}

export interface GenericInfo extends BaseEquipmentInfo {
  type: 'generic';
  isBreaker: false;
  isLine: false;
  isLabel: false;
}

export type EquipmentInfo = BreakerInfo | LineInfo | LabelInfo | GenericInfo;

export interface EquipmentAttribute {
  name: string;
  value: string;
}

export interface EquipmentControlsProps {
  children: React.ReactNode;
  targetElement: SVGElement | null;
  metadata?: SldMetadata;
  onToggleBreaker?: (breakerId: string, isClosed: boolean) => void;
  onGoToVoltageLevel?: (nextVId: string) => void;
}

export interface EquipmentAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline';
}

export interface EquipmentHeaderProps {
  info: EquipmentInfo;
}

export interface EquipmentActionsProps {
  info: EquipmentInfo;
  onToggleBreaker?: (breakerId: string, isClosed: boolean) => void;
  onGoToVoltageLevel?: (nextVId: string) => void;
}

export interface EquipmentCopyActionsProps {
  info: EquipmentInfo;
  attributes: EquipmentAttribute[];
  targetElement: SVGElement | null;
}