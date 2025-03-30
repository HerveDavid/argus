// substation.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  fetchSubstations,
  loadSubstations,
  getPaginatedSubstations,
  getSubstationById,
} from './get-substations';
import {
  Substation,
  FetchStatus,
  PaginatedResponse,
  PaginationParams,
} from '../types/substation.type';

// Mock de @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('Substation API', () => {
  // Réinitialiser les mocks avant chaque test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Nettoyer après tous les tests
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchSubstations', () => {
    it('should return substations array when response is an array', async () => {
      // Données de test
      const mockSubstations = [
        { id: '1', name: 'Substation 1' },
        { id: '2', name: 'Substation 2' },
      ] as Substation[];

      // Configuration du mock pour invoke
      vi.mocked(invoke).mockResolvedValue(mockSubstations);

      // Appel de la fonction à tester
      const result = await fetchSubstations();

      // Vérifications
      expect(invoke).toHaveBeenCalledWith('get_substations');
      expect(result).toEqual(mockSubstations);
    });

    it('should extract substations when response is an object with substations property', async () => {
      // Données de test
      const mockSubstationsObject = {
        substations: [
          { id: '1', name: 'Substation 1' },
          { id: '2', name: 'Substation 2' },
        ],
      };

      // Configuration du mock
      vi.mocked(invoke).mockResolvedValue(mockSubstationsObject);

      // Appel de la fonction
      const result = await fetchSubstations();

      // Vérifications
      expect(invoke).toHaveBeenCalledWith('get_substations');
      expect(result).toEqual(mockSubstationsObject.substations);
    });

    it('should return empty array when response is neither an array nor has substations property', async () => {
      // Configuration du mock avec une réponse invalide
      vi.mocked(invoke).mockResolvedValue({});

      // Appel de la fonction
      const result = await fetchSubstations();

      // Vérifications
      expect(invoke).toHaveBeenCalledWith('get_substations');
      expect(result).toEqual([]);
    });

    it('should propagate error when invoke rejects', async () => {
      // Configuration du mock pour rejeter
      const mockError = new Error('Backend error');
      vi.mocked(invoke).mockRejectedValue(mockError);

      // Vérification que l'erreur est propagée
      await expect(fetchSubstations()).rejects.toThrow(mockError);
      expect(invoke).toHaveBeenCalledWith('get_substations');
    });
  });

  describe('loadSubstations', () => {
    it('should return success status when invoke succeeds', async () => {
      // Données de test
      const mockStatus: FetchStatus = {
        success: true,
        message: 'Successfully loaded substations',
      };

      // Configuration du mock
      vi.mocked(invoke).mockResolvedValue(mockStatus);

      // Appel de la fonction
      const result = await loadSubstations();

      // Vérifications
      expect(invoke).toHaveBeenCalledWith('load_substations');
      expect(result).toEqual(mockStatus);
    });

    it('should handle error when invoke fails', async () => {
      // Configuration du mock pour rejeter
      const mockError = new Error('Failed to load');
      vi.mocked(invoke).mockRejectedValue(mockError);

      // Appel de la fonction
      const result = await loadSubstations();

      // Vérifications
      expect(invoke).toHaveBeenCalledWith('load_substations');
      expect(result).toEqual({
        success: false,
        message: 'Failed to load',
      });
    });
  });

  describe('getPaginatedSubstations', () => {
    it('should return paginated response with pagination params', async () => {
      // Données de test - Correction du format de pagination
      const mockPagination: PaginationParams = { page: 1, per_page: 10 };

      // Assurez-vous que la structure correspond à votre type PaginatedResponse

      const mockResponse: PaginatedResponse<Substation[]> = {
        items: [
          {
            id: '1',
            name: 'Substation 1',
            country: 'FR',
            tso: 'RTE',
            geo_tags: '',
          },
          {
            id: '2',
            name: 'Substation 2',
            country: 'FR',
            tso: 'RTE',
            geo_tags: '',
          },
        ],
        total: 20,
        page: 1,
        per_page: 10,
        total_pages: 2,
      };

      // Configuration du mock
      vi.mocked(invoke).mockResolvedValue(mockResponse);

      // Appel de la fonction
      const result = await getPaginatedSubstations(mockPagination);

      // Vérifications
      expect(invoke).toHaveBeenCalledWith('get_paginated_substations', {
        pagination: mockPagination,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should propagate error when invoke rejects', async () => {
      // Configuration du mock
      const mockError = new Error('Pagination error');
      vi.mocked(invoke).mockRejectedValue(mockError);

      // Vérification que l'erreur est propagée
      await expect(getPaginatedSubstations()).rejects.toThrow(mockError);
      expect(invoke).toHaveBeenCalledWith('get_paginated_substations', {
        pagination: undefined,
      });
    });
  });

  describe('getSubstationById', () => {
    it('should return substation when found', async () => {
      // Données de test
      const substationId = '1';
      const mockSubstation = { id: '1', name: 'Substation 1' } as Substation;

      // Configuration du mock
      vi.mocked(invoke).mockResolvedValue(mockSubstation);

      // Appel de la fonction
      const result = await getSubstationById(substationId);

      // Vérifications
      expect(invoke).toHaveBeenCalledWith('get_substation_by_id', {
        id: substationId,
      });
      expect(result).toEqual(mockSubstation);
    });

    it('should return null when substation not found', async () => {
      // Configuration du mock
      vi.mocked(invoke).mockResolvedValue(null);

      // Appel de la fonction
      const result = await getSubstationById('999');

      // Vérifications
      expect(invoke).toHaveBeenCalledWith('get_substation_by_id', {
        id: '999',
      });
      expect(result).toBeNull();
    });

    it('should propagate error when invoke rejects', async () => {
      // Configuration du mock
      const mockError = new Error('Failed to fetch substation');
      vi.mocked(invoke).mockRejectedValue(mockError);

      // Vérification que l'erreur est propagée
      await expect(getSubstationById('1')).rejects.toThrow(mockError);
      expect(invoke).toHaveBeenCalledWith('get_substation_by_id', { id: '1' });
    });
  });
});
