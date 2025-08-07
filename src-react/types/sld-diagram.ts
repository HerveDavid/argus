import { SldMetadata } from './sld-metadata';

export interface SldDiagram {
  id: string;
  element_id: string;
  svg: string;
  success: boolean;
  error?: string | null;
  metadata: SldMetadata;
  generated_at: string;
}
