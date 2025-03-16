import { fetch } from '@tauri-apps/plugin-http';
import { MetadataGrid } from '../types/metadata-diagram.type';

/**
 * Fetches a network area diagram SVG
 * @returns Promise containing the SVG as a Blob that can be used with URL.createObjectURL
 */
export async function getNetworkAreaDiagram(): Promise<Blob> {
  try {
    const { svgBlob } = await getNetworkAreaDiagramWithMetadata();
    return svgBlob;
  } catch (error) {
    console.error('Error fetching network area diagram:', error);
    throw error;
  }
}

/**
 * Fetches a network area diagram SVG with metadata
 * @returns Promise containing both the SVG as a Blob and the metadata
 */
export async function getNetworkAreaDiagramWithMetadata(): Promise<{ svgBlob: Blob; metadata: MetadataGrid }> {
  try {
    // Method 1: Get SVG and metadata in one request using format=json
    const jsonResponse = await fetch(
      'http://localhost:8000/api/v1/network/diagram/area?format=json',
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
      'http://localhost:8000/api/v1/network/diagram/area',
      {
        method: 'GET',
        headers: {
          Accept: 'image/svg+xml',
        },
      },
    );

    if (!svgResponse.ok) {
      throw new Error(
        `Failed to fetch area diagram: ${svgResponse.status} ${svgResponse.statusText}`,
      );
    }

    // 2. Get the metadata
    const metadataResponse = await fetch(
      'http://localhost:8000/api/v1/network/diagram/area/metadata',
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      },
    );

    if (!metadataResponse.ok) {
      throw new Error(
        `Failed to fetch area metadata: ${metadataResponse.status} ${metadataResponse.statusText}`,
      );
    }

    const svgBlob = await svgResponse.blob();
    const metadata = await metadataResponse.json();
    return { svgBlob, metadata };
  } catch (error) {
    console.error('Error fetching network area diagram with metadata:', error);
    throw error;
  }
}