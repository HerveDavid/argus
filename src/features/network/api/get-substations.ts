import { invoke } from '@tauri-apps/api/core';
import { Substation, Substations } from '../types/substation.type';

export const fetchSubstations = async (): Promise<Substation[]> => {
  try {
    // Invoke the Rust function
    const response = await invoke<Substations | Substation[]>('get_substations');
    
    // Check if the response is an object with a substations property
    if (response && typeof response === 'object' && 'substations' in response) {
      console.log('Received substations object:', response);
      return (response as Substations).substations;
    } 
    
    // If it's already an array, return it directly
    if (Array.isArray(response)) {
      console.log('Received substations array:', response);
      return response as Substation[];
    }
    
    // If neither format is matched, log error and return empty array
    console.error('Unexpected response format:', response);
    return [];
  } catch (error) {
    console.error('Error fetching substations:', error);
    throw error; // Re-throw to allow component to handle the error
  }
};