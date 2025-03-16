import { fetch } from '@tauri-apps/plugin-http';

/**
 * Fetches a network diagram SVG for a specific line
 * @param lineId - The ID of the line to fetch (e.g. 'VLGEN')
 * @returns Promise containing the SVG as a Blob that can be used with URL.createObjectURL
 */
export async function getSingleLineDiagram(lineId: string): Promise<Blob> {
  try {
    const response = await fetch(
      `http://localhost:8000/api/v1/network/diagram/line/${lineId}`,
      {
        method: 'GET',
        headers: {
          Accept: 'image/svg+xml',
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch diagram: ${response.status} ${response.statusText}`,
      );
    }

    // Get the SVG as a blob
    const svgBlob = await response.blob();
    return svgBlob;
  } catch (error) {
    console.error('Error fetching network diagram:', error);
    throw error;
  }
}
