import { SldMetadata } from "./sld-metatada.type";

export interface SldDiagramResult {
  svgBlob: Blob;
  metadata: SldMetadata;
}
