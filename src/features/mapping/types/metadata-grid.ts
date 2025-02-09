export interface Point {
    x: number;
    y: number;
  }
  
  export interface LayoutParameters {
    textNodesForceLayout: boolean;
    springRepulsionFactorForceLayout: number;
    textNodeFixedShift: Point;
    maxSteps: number;
    textNodeEdgeConnectionYShift: number;
  }
  
  export interface Padding {
    left: number;
    top: number;
    right: number;
    bottom: number;
  }
  
  export interface SvgParameters {
    diagramPadding: Padding;
    insertNameDesc: boolean;
    svgWidthAndHeightAdded: boolean;
    cssLocation: string;
    sizeConstraint: string;
    fixedWidth: number;
    fixedHeight: number;
    fixedScale: number;
    arrowShift: number;
    arrowLabelShift: number;
    converterStationWidth: number;
    voltageLevelCircleRadius: number;
    fictitiousVoltageLevelCircleRadius: number;
    transformerCircleRadius: number;
    nodeHollowWidth: number;
    edgesForkLength: number;
    edgesForkAperture: number;
    edgeStartShift: number;
    unknownBusNodeExtraRadius: number;
    loopDistance: number;
    loopEdgesAperture: number;
    loopControlDistance: number;
    edgeInfoAlongEdge: boolean;
    edgeNameDisplayed: boolean;
    interAnnulusSpace: number;
    svgPrefix: string;
    idDisplayed: boolean;
    substationDescriptionDisplayed: boolean;
    arrowHeight: number;
    busLegend: boolean;
    voltageLevelDetails: boolean;
    languageTag: string;
    voltageValuePrecision: number;
    powerValuePrecision: number;
    angleValuePrecision: number;
    currentValuePrecision: number;
    edgeInfoDisplayed: string;
    pstArrowHeadSize: number;
    undefinedValueSymbol: string;
  }
  
  export interface BusNode {
    svgId: string;
    equipmentId: string;
    nbNeighbours: number;
    index: number;
    vlNode: string;
  }
  
  export interface Node {
    svgId: string;
    equipmentId: string;
    x: number;
    y: number;
  }
  
  export interface Edge {
    svgId: string;
    equipmentId: string;
    node1: string;
    node2: string;
    busNode1: string;
    busNode2: string;
    type: string;
  }
  
  export interface TextNode {
    svgId: string;
    equipmentId: string;
    vlNode: string;
    shiftX: number;
    shiftY: number;
    connectionShiftX: number;
    connectionShiftY: number;
  }
  
  export interface MetadataGrid {
    layoutParameters: LayoutParameters;
    svgParameters: SvgParameters;
    busNodes: BusNode[];
    nodes: Node[];
    edges: Edge[];
    textNodes: TextNode[];
  }
  