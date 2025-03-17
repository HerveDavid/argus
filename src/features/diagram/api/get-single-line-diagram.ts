import { fetch } from '@tauri-apps/plugin-http';
import { MetadataGrid } from '../types/metadata-diagram.type';
import {
  getNoProxy,
  getProxyUrl,
} from '@/features/settings/proxy/stores/proxy.store';

// Types
export interface DiagramResult {
  svgBlob: Blob;
  metadata: MetadataGrid;
}

interface FetchOptions {
  method: string;
  headers: Record<string, string>;
  proxy?: {
    all: {
      url: string;
      noProxy: string;
    };
  };
}

// Constants
const BASE_URL = 'http://localhost:8000/api/v1/network/diagram';

/**
 * Creates fetch options with proxy configuration if needed
 * @param accept MIME type accepted for the response
 * @returns Configured fetch options
 */
const createFetchOptions = (accept: string): FetchOptions => {
  const proxyUrl = getProxyUrl();
  const noProxy = getNoProxy();

  const options: FetchOptions = {
    method: 'GET',
    headers: {
      Accept: accept,
    },
  };

  if (proxyUrl) {
    options.proxy = {
      all: {
        url: proxyUrl,
        noProxy: noProxy || 'localhost',
      },
    };
  }

  return options;
};

/**
 * Attempts to fetch the diagram and metadata in a single request
 * @param lineId ID of the line to retrieve
 * @returns SVG blob and metadata, or null if the request fails
 */
const fetchUnifiedDiagram = async (
  lineId: string,
): Promise<DiagramResult | null> => {
  const options = createFetchOptions('application/json');
  const url = `${BASE_URL}/line/${lineId}?format=json`;

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const svgBlob = new Blob([data.svg], { type: 'image/svg+xml' });

    return { svgBlob, metadata: data.metadata };
  } catch (error) {
    console.warn('Unified request failed, using fallback:', error);
    return null;
  }
};

/**
 * Retrieves only the SVG diagram
 * @param lineId ID of the line to retrieve
 * @returns SVG Blob
 */
const fetchDiagramSvg = async (lineId: string): Promise<Blob> => {
  const options = createFetchOptions('image/svg+xml');
  const url = `${BASE_URL}/line/${lineId}`;

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(
      `Failed to retrieve diagram: ${response.status} ${response.statusText}`,
    );
  }

  return await response.blob();
};

/**
 * Retrieves only the diagram metadata
 * @param lineId ID of the line to retrieve
 * @returns Diagram metadata
 */
const fetchDiagramMetadata = async (lineId: string): Promise<MetadataGrid> => {
  const options = createFetchOptions('application/json');
  const url = `${BASE_URL}/line/${lineId}/metadata`;

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(
      `Failed to retrieve metadata: ${response.status} ${response.statusText}`,
    );
  }

  return await response.json();
};

/**
 * Retrieves the diagram and metadata in two separate requests
 * @param lineId ID of the line to retrieve
 * @returns SVG blob and metadata
 */
const fetchSeparateDiagramAndMetadata = async (
  lineId: string,
): Promise<DiagramResult> => {
  const [svgBlob, metadata] = await Promise.all([
    fetchDiagramSvg(lineId),
    fetchDiagramMetadata(lineId),
  ]);

  return { svgBlob, metadata };
};

/**
 * Retrieves a network diagram SVG with its metadata for a specific line
 * @param lineId ID of the line to retrieve
 * @returns Promise containing the SVG blob and metadata
 */
export const getSingleLineDiagramWithMetadata = async (
  lineId: string,
): Promise<DiagramResult> => {
  try {
    // First try the unified endpoint
    const unifiedResult = await fetchUnifiedDiagram(lineId);
    if (unifiedResult) {
      return unifiedResult;
    }

    // Fallback to separate requests if the unified endpoint fails
    return await fetchSeparateDiagramAndMetadata(lineId);
  } catch (error) {
    console.error('Error retrieving diagram with metadata:', error);
    throw error;
  }
};

/**
 * Retrieves only the SVG diagram for a specific line
 * @param lineId ID of the line to retrieve
 * @returns Promise containing the SVG blob
 */
export const getSingleLineDiagram = async (lineId: string): Promise<Blob> => {
  try {
    const { svgBlob } = await getSingleLineDiagramWithMetadata(lineId);
    return svgBlob;
  } catch (error) {
    console.error('Error retrieving network diagram:', error);
    throw error;
  }
};
