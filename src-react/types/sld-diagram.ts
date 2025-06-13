import { SldMetadata } from './sld-metadata';

export interface SldDiagramResult {
  svgBlob: Blob;
  metadata: SldMetadata;
}
