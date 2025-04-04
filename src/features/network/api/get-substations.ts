import { invoke } from '@tauri-apps/api/core';
import { handleApiError } from './api-utils';
import {
  FetchStatus,
  PaginatedResponse,
  PaginationParams,
  Substation,
  Substations,
} from '../types/substation.type';

/**
 * Fetch all substations
 */
export const fetchSubstations = async (): Promise<Substation[]> => {
  try {
    const response = await invoke<Substation[]>('get_substations');

    if (response && typeof response === 'object' && 'substations' in response) {
      return (response as Substations).substations;
    }

    if (Array.isArray(response)) {
      return response as Substation[];
    }

    return [];
  } catch (error) {
    throw handleApiError(error, 'Error fetching substations');
  }
};

/**
 * Load all substations from the backend and store them in application state
 */
export async function loadSubstations(): Promise<FetchStatus> {
  try {
    const result = await invoke<FetchStatus>('load_substations');

    if (result && !result.success) {
      throw new Error(result.message || 'Operation failed');
    }

    return result;
  } catch (error) {
    throw handleApiError(error, 'Failed to load substations');
  }
}

/**
 * Get paginated substations from the application state
 */
export async function getPaginatedSubstations(
  pagination?: PaginationParams,
): Promise<PaginatedResponse<Substation[]>> {
  try {
    return await invoke<PaginatedResponse<Substation[]>>(
      'get_paginated_substations',
      { pagination },
    );
  } catch (error) {
    throw handleApiError(error, 'Error fetching paginated substations');
  }
}

/**
 * Get a specific substation by ID from the application state
 */
export async function getSubstationById(
  id: string,
): Promise<Substation | null> {
  try {
    return await invoke<Substation | null>('get_substation_by_id', { id });
  } catch (error) {
    throw handleApiError(error, `Error fetching substation with ID ${id}`);
  }
}
