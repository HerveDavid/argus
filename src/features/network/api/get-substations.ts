import { invoke } from '@tauri-apps/api/core';
import {
  PaginatedResponse,
  PaginationParams,
  Substation,
  Substations,
} from '../types/substation.type';

export const fetchSubstations = async (): Promise<Substation[]> => {
  try {
    const response = await invoke<Substation[]>('get_substations');

    if (response && typeof response === 'object' && 'substations' in response) {
      console.log('Received substations object:', response);
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
 * Fetches substations with pagination
 * @param params Optional pagination parameters
 * @returns Promise with paginated substations
 */
export async function getPaginatedSubstations(
  params?: PaginationParams,
): Promise<PaginatedResponse<Substation[]>> {
  return invoke<PaginatedResponse<Substation[]>>('get_paginated_substations', {
    pagination: params,
  });
}
