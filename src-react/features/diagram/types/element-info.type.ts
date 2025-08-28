import { MeasurementType, Node } from '@/types/sld-metadata';

export interface ElementInfo {
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
  isMeasurement: boolean;
  measurementType: MeasurementType | null;
  measurementValue: string | null;
  parentEquipmentId: string | null;
}
