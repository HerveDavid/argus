import { invoke } from '@tauri-apps/api/core';
import { SldMetadata } from '../types/sld-metatada.type';
import { handleApiError } from '@/lib/api-utils';

// Types
interface SldDiagramResult {
  svgBlob: Blob;
  metadata: SldMetadata;
}

/**
 * Retrieves a network diagram SVG with its metadata for a specific line
 * @param line_id ID of the line to retrieve
 * @returns Promise containing the SVG blob and metadata
 */
export const getSingleLineDiagramWithMetadata = async (
  line_id: string,
): Promise<SldDiagramResult> => {
  try {
    // Invoke the Tauri command
    const result = await invoke<{ svg: string; metadata: SldMetadata }>(
      'get_single_line_diagram_with_metadata_n',
      { line_id },
    );

    // Convert the SVG string to a Blob
    const svgBlob = new Blob([result.svg], { type: 'image/svg+xml' });

    return {
      svgBlob,
      metadata: result.metadata,
    };
  } catch (error) {
    throw handleApiError(
      error,
      `Error retrieving diagram with metadata: {error}`,
    );
  }
};

/**
 * Retrieves only the SVG diagram for a specific line
 * @param line_id ID of the line to retrieve
 * @returns Promise containing the SVG blob
 */
export const getSingleLineDiagram = async (line_id: string): Promise<Blob> => {
  try {
    // Invoke the Tauri command
    const result = await invoke<{ data: number[]; mime_type: string }>(
      'get_single_line_diagram_n',
      { line_id },
    );

    // Convert the byte array to a Uint8Array
    const uint8Array = new Uint8Array(result.data);

    // Create a Blob from the Uint8Array
    return new Blob([uint8Array], { type: result.mime_type });
  } catch (error) {
    throw handleApiError(error, `Error retrieving network diagram: {error}`);
  }
};
