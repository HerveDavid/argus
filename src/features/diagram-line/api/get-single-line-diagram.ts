import { fetch } from '@tauri-apps/plugin-http';
import { MetadataGrid } from '../types/metadata-diagram.type';

/**
 * Fetches a network diagram SVG for a specific line
 * @param lineId - The ID of the line to fetch (e.g. 'VLGEN')
 * @returns Promise containing the SVG as a Blob that can be used with URL.createObjectURL
 */
export async function getSingleLineDiagram(lineId: string): Promise<Blob> {
  try {
    const { svgBlob } = await getSingleLineDiagramWithMetadata(lineId);
    return svgBlob;
  } catch (error) {
    console.error('Error fetching network diagram:', error);
    throw error;
  }
}

/**
 * Fetches a network diagram SVG with metadata for a specific line
 * @param lineId - The ID of the line to fetch (e.g. 'VLGEN')
 * @returns Promise containing both the SVG as a Blob and the metadata
 */
export async function getSingleLineDiagramWithMetadata(
  lineId: string,
): Promise<{ svgBlob: Blob; metadata: MetadataGrid }> {
  try {
    // Method 1: Get SVG and metadata in one request using format=json
    const jsonResponse = await fetch(
      `http://localhost:8000/api/v1/network/diagram/line/${lineId}?format=json`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (jsonResponse.ok) {
      const data = await jsonResponse.json();
      // Convert SVG string to Blob
      const svgBlob = new Blob([data.svg], { type: 'image/svg+xml' });
      return { svgBlob, metadata: data.metadata };
    }

    // Fallback method: Make two separate requests if the unified endpoint fails
    // 1. Get the SVG
    const svgResponse = await fetch(
      `http://localhost:8000/api/v1/network/diagram/line/${lineId}`,
      {
        method: 'GET',
        headers: {
          Accept: 'image/svg+xml',
        },
      },
    );

    if (!svgResponse.ok) {
      throw new Error(
        `Failed to fetch diagram: ${svgResponse.status} ${svgResponse.statusText}`,
      );
    }

    // 2. Get the metadata
    const metadataResponse = await fetch(
      `http://localhost:8000/api/v1/network/diagram/line/${lineId}/metadata`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (!metadataResponse.ok) {
      throw new Error(
        `Failed to fetch metadata: ${metadataResponse.status} ${metadataResponse.statusText}`,
      );
    }

    const svgBlob = await svgResponse.blob();
    const metadata = await metadataResponse.json();

    return { svgBlob, metadata };
  } catch (error) {
    console.error('Error fetching network diagram with metadata:', error);
    throw error;
  }
}
