import {
  createServerUrlError,
  ServerUrlError,
  ServerUrlResponse,
} from '../types/url.type';
import { invokeTauri } from '@/utils/invoke-tauri';

/**
 * Gets the server URL from Tauri backend
 */
export const getServerUrlFromTauri = () =>
  invokeTauri<ServerUrlResponse, ServerUrlError>(
    'get_server_url',
    undefined,
    createServerUrlError,
  );

/**
 * Sets the server URL in Tauri backend
 */
export const setServerUrlInTauri = (url: string) =>
  invokeTauri<ServerUrlResponse, ServerUrlError>(
    'set_server_url',
    { server_url: url },
    createServerUrlError,
  );
