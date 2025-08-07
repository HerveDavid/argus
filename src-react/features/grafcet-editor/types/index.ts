import * as go from 'gojs';

export { CustomLinkingTool } from './custom-linking-tool';
export { BarLink } from './bar-link';

// TypeScript interfaces for the data structures
export interface NodeData extends go.ObjectData {
  key: number;
  category?: string;
  location?: string;
  step?: string;
  text?: string;
  size?: string;
}

export interface LinkData extends go.ObjectData {
  key: number;
  from: number;
  to: number;
  text?: string;
  category?: string;
}

export interface DiagramData {
  nodeDataArray: NodeData[];
  linkDataArray: LinkData[];
  modelData: go.ObjectData;
  skipsDiagramUpdate: boolean;
}
