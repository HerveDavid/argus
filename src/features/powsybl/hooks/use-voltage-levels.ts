import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useErrorHandling } from './use-error-handling';
import {
  getPaginatedVoltageLevels,
  loadVoltageLevels,
  searchVoltageLevels,
} from '../api/get-voltage-levels';

// Query keys as constants for consistency
const QUERY_KEYS = {
  VOLTAGE_LEVELS_CHECK: 'voltageLevelsCheck',
  VOLTAGE_LEVELS: 'voltageLevels',
  VOLTAGE_LEVELS_SEARCH: 'voltageLevelsSearch',
};

export const useVoltageLevels = (initialItemsPerPage = 20) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(initialItemsPerPage);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFields, setSearchFields] = useState<string[] | undefined>(
    undefined,
  );
  const [isSearching, setIsSearching] = useState(false);

  const queryClient = useQueryClient();
  const { errors, setError, clearError, clearAllErrors } = useErrorHandling();

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchFields]);

  // Check if initial data exists
  const initialDataCheck = useQuery({
    queryKey: [QUERY_KEYS.VOLTAGE_LEVELS_CHECK],
    queryFn: async () => {
      try {
        const result = await getPaginatedVoltageLevels({
          page: 1,
          per_page: 1,
        });
        return result.total > 0;
      } catch (error) {
        setError('initialDataCheck', error, () => initialDataCheck.refetch());
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch paginated voltageLevels or search results based on isSearching flag
  const voltageLevelsQuery = useQuery({
    queryKey: [
      isSearching ? QUERY_KEYS.VOLTAGE_LEVELS_SEARCH : QUERY_KEYS.VOLTAGE_LEVELS,
      currentPage,
      itemsPerPage,
      searchQuery,
      searchFields,
    ],
    queryFn: async () => {
      try {
        if (isSearching && searchQuery.trim()) {
          return await searchVoltageLevels(
            searchQuery,
            { page: currentPage, per_page: itemsPerPage },
            searchFields,
          );
        } else {
          return await getPaginatedVoltageLevels({
            page: currentPage,
            per_page: itemsPerPage,
          });
        }
      } catch (error) {
        setError('voltageLevelsQuery', error, () => voltageLevelsQuery.refetch());
        throw error;
      }
    },
    enabled: initialDataCheck.data === true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Mutation to load all voltageLevels
  const loadAllVoltageLevelsMutation = useMutation({
    mutationFn: loadVoltageLevels,
    onSuccess: () => {
      clearError('loadAllVoltageLevels');
      invalidateQueries();
      setCurrentPage(1);
      // Reset search state on reload
      setSearchQuery('');
      setIsSearching(false);
    },
    onError: (error) => {
      setError('loadAllVoltageLevels', error, handleLoadAllVoltageLevels);
    },
  });

  // Helper function to invalidate queries
  const invalidateQueries = () => {
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.VOLTAGE_LEVELS_CHECK],
    });
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.VOLTAGE_LEVELS],
    });
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.VOLTAGE_LEVELS_SEARCH],
    });
  };

  // Handle loading all voltageLevels
  const handleLoadAllVoltageLevels = () => {
    clearError('loadAllVoltageLevels');
    loadAllVoltageLevelsMutation.mutate();
  };

  // Search functions
  const handleSearch = (query: string, fields?: string[]) => {
    setSearchQuery(query);
    setSearchFields(fields);
    setIsSearching(!!query.trim());
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchFields(undefined);
    setIsSearching(false);
    setCurrentPage(1);
  };

  // Pagination controls
  const goToNextPage = () => {
    if (
      voltageLevelsQuery.data &&
      currentPage < voltageLevelsQuery.data.total_pages
    ) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  return {
    initialDataCheck,
    voltageLevelsQuery,
    loadAllVoltageLevelsMutation,
    handleLoadAllVoltageLevels,
    currentPage,
    itemsPerPage,
    goToNextPage,
    goToPreviousPage,
    errors,
    clearAllErrors,

    // Search related
    searchQuery,
    isSearching,
    handleSearch,
    clearSearch,
    searchFields,
    setSearchFields,
  };
};
