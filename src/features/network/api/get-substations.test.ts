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

// Mock for @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Test data fixtures
const mockSubstationData = {
  basic: [
    { id: '1', name: 'Substation 1' },
    { id: '2', name: 'Substation 2' },
  ] as Substation[],

  detailed: [
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
  ] as Substation[],

  withWrapper: {
    substations: [
      { id: '1', name: 'Substation 1' },
      { id: '2', name: 'Substation 2' },
    ],
  },

  single: { id: '1', name: 'Substation 1' } as Substation,

  emptyResponse: {},
};

// Pagination test data
const paginationData = {
  params: { page: 1, per_page: 10 } as PaginationParams,

  response: {
    items: mockSubstationData.detailed,
    total: 20,
    page: 1,
    per_page: 10,
    total_pages: 2,
  } as PaginatedResponse<Substation[]>,
};

// Status response data
const statusData = {
  success: {
    success: true,
    message: 'Successfully loaded substations',
  } as FetchStatus,

  error: {
    success: false,
    message: 'Failed to load',
  } as FetchStatus,
};

// Error messages
const errorMessages = {
  backend: 'Backend error',
  pagination: 'Pagination error',
  fetch: 'Failed to fetch substation',
  load: 'Failed to load',
};

describe('Substation API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Clean up after all tests
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper function to configure invoke mock
  const mockInvoke = (returnValue: any) => {
    vi.mocked(invoke).mockResolvedValue(returnValue);
  };

  // Helper function to configure invoke mock to reject
  const mockInvokeFailure = (errorMessage: any) => {
    vi.mocked(invoke).mockRejectedValue(new Error(errorMessage));
  };

  describe('fetchSubstations', () => {
    // Test case definitions
    const testCases = [
      {
        name: 'should return substations array when response is an array',
        mockReturn: mockSubstationData.basic,
        expected: mockSubstationData.basic,
      },
      {
        name: 'should extract substations when response is an object with substations property',
        mockReturn: mockSubstationData.withWrapper,
        expected: mockSubstationData.withWrapper.substations,
      },
      {
        name: 'should return empty array when response is neither an array nor has substations property',
        mockReturn: mockSubstationData.emptyResponse,
        expected: [],
      },
    ];

    // Run all defined test cases
    testCases.forEach(({ name, mockReturn, expected }) => {
      it(name, async () => {
        mockInvoke(mockReturn);

        const result = await fetchSubstations();

        expect(invoke).toHaveBeenCalledWith('get_substations');
        expect(result).toEqual(expected);
      });
    });

    it('should propagate error when invoke rejects', async () => {
      mockInvokeFailure(errorMessages.backend);

      await expect(fetchSubstations()).rejects.toThrow(errorMessages.backend);
      expect(invoke).toHaveBeenCalledWith('get_substations');
    });
  });

  describe('loadSubstations', () => {
    it('should return success status when invoke succeeds', async () => {
      mockInvoke(statusData.success);

      const result = await loadSubstations();

      expect(invoke).toHaveBeenCalledWith('load_substations');
      expect(result).toEqual(statusData.success);
    });

    it('should handle error when invoke fails', async () => {
      mockInvokeFailure(errorMessages.load);

      const result = await loadSubstations();

      expect(invoke).toHaveBeenCalledWith('load_substations');
      expect(result).toEqual(statusData.error);
    });
  });

  describe('getPaginatedSubstations', () => {
    it('should return paginated response with pagination params', async () => {
      mockInvoke(paginationData.response);

      const result = await getPaginatedSubstations(paginationData.params);

      expect(invoke).toHaveBeenCalledWith('get_paginated_substations', {
        pagination: paginationData.params,
      });
      expect(result).toEqual(paginationData.response);
    });

    it('should propagate error when invoke rejects', async () => {
      mockInvokeFailure(errorMessages.pagination);

      await expect(getPaginatedSubstations()).rejects.toThrow(
        errorMessages.pagination,
      );
      expect(invoke).toHaveBeenCalledWith('get_paginated_substations', {
        pagination: undefined,
      });
    });
  });

  describe('getSubstationById', () => {
    const testCases = [
      {
        name: 'should return substation when found',
        id: '1',
        mockReturn: mockSubstationData.single,
        expected: mockSubstationData.single,
      },
      {
        name: 'should return null when substation not found',
        id: '999',
        mockReturn: null,
        expected: null,
      },
    ];

    testCases.forEach(({ name, id, mockReturn, expected }) => {
      it(name, async () => {
        mockInvoke(mockReturn);

        const result = await getSubstationById(id);

        expect(invoke).toHaveBeenCalledWith('get_substation_by_id', { id });
        expect(result).toEqual(expected);
      });
    });

    it('should propagate error when invoke rejects', async () => {
      const testId = '1';
      mockInvokeFailure(errorMessages.fetch);

      await expect(getSubstationById(testId)).rejects.toThrow(
        errorMessages.fetch,
      );
      expect(invoke).toHaveBeenCalledWith('get_substation_by_id', {
        id: testId,
      });
    });
  });
});
