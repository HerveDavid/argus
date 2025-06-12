import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useErrorHandling } from './use-error-handling';
import {
  getPaginatedSubstations,
  loadSubstations,
  searchSubstations,
} from '../api/get-substations';

// Query keys as constants for consistency
const QUERY_KEYS = {
  SUBSTATIONS_CHECK: 'substationsCheck',
  SUBSTATIONS: 'substations',
  SUBSTATIONS_SEARCH: 'substationsSearch',
};

export const useSubstations = (initialItemsPerPage = 20) => {
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
    queryKey: [QUERY_KEYS.SUBSTATIONS_CHECK],
    queryFn: async () => {
      try {
        const result = await getPaginatedSubstations({
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

  // Fetch paginated substations or search results based on isSearching flag
  const substationsQuery = useQuery({
    queryKey: [
      isSearching ? QUERY_KEYS.SUBSTATIONS_SEARCH : QUERY_KEYS.SUBSTATIONS,
      currentPage,
      itemsPerPage,
      searchQuery,
      searchFields,
    ],
    queryFn: async () => {
      try {
        if (isSearching && searchQuery.trim()) {
          return await searchSubstations(
            searchQuery,
            { page: currentPage, per_page: itemsPerPage },
            searchFields,
          );
        } else {
          return await getPaginatedSubstations({
            page: currentPage,
            per_page: itemsPerPage,
          });
        }
      } catch (error) {
        setError('substationsQuery', error, () => substationsQuery.refetch());
        throw error;
      }
    },
    enabled: initialDataCheck.data === true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Mutation to load all substations
  const loadAllSubstationsMutation = useMutation({
    mutationFn: loadSubstations,
    onSuccess: () => {
      clearError('loadAllSubstations');
      invalidateQueries();
      setCurrentPage(1);
      // Reset search state on reload
      setSearchQuery('');
      setIsSearching(false);
    },
    onError: (error) => {
      setError('loadAllSubstations', error, handleLoadAllSubstations);
    },
  });

  // Helper function to invalidate queries
  const invalidateQueries = () => {
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.SUBSTATIONS_CHECK],
    });
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.SUBSTATIONS],
    });
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.SUBSTATIONS_SEARCH],
    });
  };

  // Handle loading all substations
  const handleLoadAllSubstations = () => {
    clearError('loadAllSubstations');
    loadAllSubstationsMutation.mutate();
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
      substationsQuery.data &&
      currentPage < substationsQuery.data.total_pages
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
    substationsQuery,
    loadAllSubstationsMutation,
    handleLoadAllSubstations,
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