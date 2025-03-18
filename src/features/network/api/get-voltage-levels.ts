import { fetch } from '@tauri-apps/plugin-http';
import {
  getNoProxy,
  getProxyUrl,
} from '@/features/settings/proxy/stores/proxy.store';
import { FetchOptions } from '../types/fetch-options.type';
import { VoltageLevel, VoltageLevels } from '../types/voltage-level.type';

// Constants
const BASE_URL = 'http://localhost:8000/api/v1/network/voltage-levels';

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

export const fetchVoltageLevelsList = async (): Promise<VoltageLevels> => {
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

export interface VoltageLevelsResponse {
  substation_id: string,
  voltage_levels: VoltageLevels
}

export const fetchVoltageLevels = async (id: string): Promise<VoltageLevels> => {
  const options = createFetchOptions('application/json');
  const url = `http://localhost:8000/api/v1/network/substations/${id}/voltage-levels`;

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(
      `Failed to retrieve substations: ${response.status} ${response.statusText}`,
    );
  }

  let res: VoltageLevelsResponse = await response.json();

  return res.voltage_levels;
};
