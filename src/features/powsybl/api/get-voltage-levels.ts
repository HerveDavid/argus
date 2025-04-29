import { invoke } from '@tauri-apps/api/core';
import { handleApiError } from '@/lib/api-utils';
import { VoltageLevel, VoltageLevels } from '@/types/voltage-level.type';
import {
  FetchStatus,
  PaginatedResponse,
  PaginationParams,
} from '@/types/pagination.type';

/**
 * Fetch all voltage_levels
 */
export const fetchVoltageLevels = async (): Promise<VoltageLevel[]> => {
  try {
    const response = await invoke<VoltageLevel[]>('plugin:powsybl|get_voltage_levels');

    if (response && typeof response === 'object' && 'voltage_levels' in response) {
      return (response as VoltageLevels).voltage_levels;
    }

    if (Array.isArray(response)) {
      return response as VoltageLevel[];
    }

    return [];
  } catch (error) {
    throw handleApiError(error, 'Error fetching voltage_levels');
  }
};

/**
 * Load all voltage_levels from the backend and store them in application state
 */
export async function loadVoltageLevels(): Promise<FetchStatus> {
  try {
    const result = await invoke<FetchStatus>('plugin:powsybl|load_voltage_levels');

    if (result && !result.success) {
      throw new Error(result.message || 'Operation failed');
    }

    return result;
  } catch (error) {
    throw handleApiError(error, 'Failed to load voltage_levels');
  }
}

/**
 * Get paginated voltage_levels from the application state
 */
export async function getPaginatedVoltageLevels(
  pagination?: PaginationParams,
): Promise<PaginatedResponse<VoltageLevel[]>> {
  try {
    return await invoke<PaginatedResponse<VoltageLevel[]>>(
      'plugin:powsybl|get_paginated_voltage_levels',
      { pagination },
    );
  } catch (error) {
    throw handleApiError(error, 'Error fetching paginated voltage_levels');
  }
}

/**
 * Get a specific substation by ID from the application state
 */
export async function getVoltageLevelById(
  id: string,
): Promise<VoltageLevel | null> {
  try {
    return await invoke<VoltageLevel | null>('plugin:powsybl|get_voltage_levels_by_id', { id });
  } catch (error) {
    throw handleApiError(error, `Error fetching voltage_levels with ID ${id}`);
  }
}

/**
 * Search for voltage_levels in the application state
 * @param query - The search query string
 * @param pagination - Optional pagination parameters
 * @param searchFields - Optional array of fields to search (defaults to id low_voltage_limit if not provided)
 * @returns Paginated response containing matching voltage_levels
 */
export async function searchVoltageLevels(
  query: string,
  pagination?: PaginationParams,
  search_fields?: string[],
): Promise<PaginatedResponse<VoltageLevel[]>> {
  try {
    return await invoke<PaginatedResponse<VoltageLevel[]>>('plugin:powsybl|search_voltage_levels', {
      query,
      pagination,
      search_fields,
    });
  } catch (error) {
    throw handleApiError(
      error,
      `Error searching voltage_levels with query: ${query}`,
    );
  }
}
