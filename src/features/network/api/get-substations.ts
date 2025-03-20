import { invoke } from '@tauri-apps/api/core';
import {
  FetchStatus,
  PaginatedResponse,
  PaginationParams,
  Substation,
  Substations,
} from '../types/substation.type';

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
    throw error; // Re-throw to allow component to handle the error
  }
};
/**
 * Load all substations from the backend and store them in application state
 * This function should be called once before accessing substations
 */
export async function loadSubstations(): Promise<FetchStatus> {
  try {
    return await invoke<FetchStatus>('load_substations');
  } catch (error) {
    console.error('Error loading substations:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get paginated substations from the application state (no API call is made)
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
    console.error('Error fetching paginated substations:', error);
    throw error;
  }
}

/**
 * Get a specific substation by ID from the application state
 */
export async function getSubstationById(
  id: string,
): Promise<Substation | null> {
  try {
    const substation = await invoke<Substation | null>('get_substation_by_id', {
      id,
    });
    return substation;
  } catch (error) {
    console.error(`Error fetching substation with ID ${id}:`, error);
    throw error;
  }
}
