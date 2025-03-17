import { fetch } from '@tauri-apps/plugin-http';
import { MetadataGrid } from '../types/metadata-diagram.type';
import {
  getNoProxy,
  getProxyUrl,
} from '@/features/settings/proxy/stores/proxy.store';

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

export async function getSingleLineDiagramWithMetadata(
  lineId: string,
): Promise<{ svgBlob: Blob; metadata: MetadataGrid }> {
  try {
    // Retrieve proxy information from the store
    const proxyUrl = getProxyUrl();
    const noProxy = getNoProxy();

    // Basic options for the fetch request
    const fetchOptions: any = {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    };

    // Add proxy options if a proxy URL is configured
    if (proxyUrl) {
      fetchOptions.proxy = {
        all: {
          url: proxyUrl,
          noProxy: noProxy || 'localhost',
        },
      };
    }

    // Method 1: Get SVG and metadata in one request using format=json
    const jsonResponse = await fetch(
      `http://localhost:8000/api/v1/network/diagram/line/${lineId}?format=json`,
      fetchOptions,
    );

    if (jsonResponse.ok) {
      const data = await jsonResponse.json();
      // Convert SVG string to Blob
      const svgBlob = new Blob([data.svg], { type: 'image/svg+xml' });
      return { svgBlob, metadata: data.metadata };
    }

    // Prepare options for fallback requests
    const svgFetchOptions = {
      ...fetchOptions,
      headers: {
        Accept: 'image/svg+xml',
      },
    };

    const metadataFetchOptions = {
      ...fetchOptions,
      headers: {
        Accept: 'application/json',
      },
    };

    // Fallback method: Make two separate requests if the unified endpoint fails
    // 1. Get the SVG
    const svgResponse = await fetch(
      `http://localhost:8000/api/v1/network/diagram/line/${lineId}`,
      svgFetchOptions,
    );

    if (!svgResponse.ok) {
      throw new Error(
        `Failed to fetch diagram: ${svgResponse.status} ${svgResponse.statusText}`,
      );
    }

    // 2. Get the metadata
    const metadataResponse = await fetch(
      `http://localhost:8000/api/v1/network/diagram/line/${lineId}/metadata`,
      metadataFetchOptions,
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
