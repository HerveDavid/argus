// Base interfaces
export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Padding {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Dimensions {
  width: number;
  height: number;
  viewbox: ViewBox;
}

// Component related interfaces
export interface AnchorPoint {
  orientation: 'VERTICAL' | 'HORIZONTAL' | 'NONE';
}

export interface Transformations {
  LEFT?: string;
  RIGHT?: string;
  DOWN?: string;
}

export interface Component {
  type: string;
  styleClass?: string;
  size: Size;
  anchorPoints?: AnchorPoint[];
  transformations?: Transformations;
}

export interface Label {
  id: string;
  positionName: string;
}

export interface FeederInfo {
  id: string;
  componentType: string;
  equipmentId: string;
  side?: string;
}

// Node representation
export interface Node {
  id: string;
  componentType?: string;
  equipmentId?: string;
  direction?: string;
  labels?: Label[];
  open: boolean;
  vid: string;
  vlabel: boolean;
  nextVId?: string;
  rotationAngle?: number;
}

// Connection representation
export interface Wire {
  id: string;
  nodeId1: string;
  nodeId2: string;
  snakeLine: boolean;
  straight: boolean;
}

// Layout parameters
export interface LayoutParams {
  adaptCellHeightToContent: boolean;
  busbarsAlignment: string;
  cellWidth: number;
  cgmesDiagramName: string | null;
  cgmesScaleFactor: number;
  cgmesUseNames: boolean;
  componentsOnBusbars: string[];
  diagramPadding: Padding;
  externCellHeight: number;
  horizontalBusPadding: number;
  horizontalSnakeLinePadding: number;
  internCellHeight: number;
  maxComponentHeight: number;
  minExternCellHeight: number;
  minSpaceBetweenComponents: number;
  removeFictitiousSwitchNodes: boolean;
  spaceForFeederInfos: number;
  stackHeight: number;
  verticalSnakeLinePadding: number;
  verticalSpaceBus: number;
  voltageLevelPadding: Padding;
  zoneLayoutSnakeLinePadding: number;
}

// SVG parameters
export interface SvgParams {
  activePowerUnit: string;
  angleLabelShift: number;
  angleValuePrecision: number;
  avoidSVGComponentsDuplication: boolean;
  busInfoMargin: number;
  busesLegendAdded: boolean;
  cssLocation: string;
  currentUnit: string;
  currentValuePrecision: number;
  diagramName: string | null;
  displayConnectivityNodesId: boolean;
  displayCurrentFeederInfo: boolean;
  displayEquipmentNodesLabel: boolean;
  drawStraightWires: boolean;
  feederInfoSymmetry: boolean;
  feederInfosIntraMargin: number;
  feederInfosOuterMargin: number;
  labelCentered: boolean;
  labelDiagonal: boolean;
  languageTag: string;
  powerValuePrecision: number;
  prefixId: string;
  reactivePowerUnit: string;
  showGrid: boolean;
  showInternalNodes: boolean;
  svgWidthAndHeightAdded: boolean;
  tooltipEnabled: boolean;
  undefinedValueSymbol: string;
  unifyVoltageLevelColors: boolean;
  useName: boolean;
  voltageValuePrecision: number;
}

// Callback types
export type OnNextVoltageCallbackType = (nextVId: string) => void;
export type OnBreakerCallbackType = (
  breakerId: string,
  open: boolean,
  switchElement: SVGElement | null,
) => void;
export type OnFeederCallbackType = (
  equipmentId: string,
  equipmentType: string | null,
  svgId: string,
  x: number,
  y: number,
) => void;
export type OnBusCallbackType = (
  busId: string,
  svgId: string,
  x: number,
  y: number,
) => void;
export type OnToggleSldHoverCallbackType = (
  hovered: boolean,
  anchorEl: EventTarget | null,
  equipmentId: string,
  equipmentType: string,
) => void;

// Constants
export const SWITCH_COMPONENT_TYPES = new Set([
  'BREAKER',
  'DISCONNECTOR',
  'LOAD_BREAK_SWITCH',
]);

export const FEEDER_COMPONENT_TYPES = new Set([
  'LINE',
  'LOAD',
  'BATTERY',
  'DANGLING_LINE',
  'TIE_LINE',
  'GENERATOR',
  'VSC_CONVERTER_STATION',
  'LCC_CONVERTER_STATION',
  'HVDC_LINE',
  'CAPACITOR',
  'INDUCTOR',
  'STATIC_VAR_COMPENSATOR',
  'TWO_WINDINGS_TRANSFORMER',
  'TWO_WINDINGS_TRANSFORMER_LEG',
  'THREE_WINDINGS_TRANSFORMER',
  'THREE_WINDINGS_TRANSFORMER_LEG',
  'PHASE_SHIFT_TRANSFORMER',
]);

export const BUSBAR_SECTION_TYPES = new Set(['BUSBAR_SECTION']);

export const MAX_ZOOM_LEVEL = 10;
export const MIN_ZOOM_LEVEL_SUB = 0.1;
export const MIN_ZOOM_LEVEL_VL = 0.5;

// Main SLD Metadata interface
export interface SldMetadata {
  busInfos: any[];
  busLegendInfos: any[];
  components: Component[];
  feederInfos: FeederInfo[];
  layoutParams: LayoutParams;
  lines: any[];
  nodes: Node[];
  svgParams: SvgParams;
  wires: Wire[];
}
