import { invoke } from '@tauri-apps/api/core';
import { Substation, Substations } from '../types/substation.type';
import {
  FetchStatus,
  PaginatedResponse,
  PaginationParams,
} from '../types/pagination.type';

export const handleApiError = (error: unknown, context: string): Error => {
  console.error(`Error in ${context}:`, error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  return new Error(`${context}: ${errorMessage}`);
};

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

/**
 * Search for substations in the application state
 * @param query - The search query string
 * @param pagination - Optional pagination parameters
 * @param searchFields - Optional array of fields to search (defaults to name, country, tso, geo_tags if not provided)
 * @returns Paginated response containing matching substations
 */
export async function searchSubstations(
  query: string,
  pagination?: PaginationParams,
  search_fields?: string[],
): Promise<PaginatedResponse<Substation[]>> {
  try {
    return await invoke<PaginatedResponse<Substation[]>>('search_substations', {
      query,
      pagination,
      search_fields,
    });
  } catch (error) {
    throw handleApiError(
      error,
      `Error searching substations with query: ${query}`,
    );
  }
}
