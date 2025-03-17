import { fetch } from '@tauri-apps/plugin-http';
import {
  getNoProxy,
  getProxyUrl,
} from '@/features/settings/proxy/stores/proxy.store';
import { FetchOptions } from '../types/fetch-options.type';
import { Substations } from '../types/substation.type';

// Constants
const BASE_URL = 'http://localhost:8000/api/v1/network/substations';

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

export const fetchSubstations = async (): Promise<Substations> => {
  const options = createFetchOptions('application/json');
  const url = `${BASE_URL}`;

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(
      `Failed to retrieve substations: ${response.status} ${response.statusText}`,
    );
  }

  return await response.json();
};
  