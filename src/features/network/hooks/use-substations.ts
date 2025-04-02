import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useErrorHandling } from './use-error-handling';
import {
  getPaginatedSubstations,
  loadSubstations,
} from '../api/get-substations';

// Query keys as constants for consistency
const QUERY_KEYS = {
  SUBSTATIONS_CHECK: 'substationsCheck',
  SUBSTATIONS: 'substations',
};

export const useSubstations = (initialItemsPerPage = 20) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(initialItemsPerPage);
  const queryClient = useQueryClient();
  const { errors, setError, clearError, clearAllErrors } = useErrorHandling();

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

  // Fetch paginated substations
  const substationsQuery = useQuery({
    queryKey: [QUERY_KEYS.SUBSTATIONS, currentPage, itemsPerPage],
    queryFn: async () => {
      try {
        return await getPaginatedSubstations({
          page: currentPage,
          per_page: itemsPerPage,
        });
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
  };

  // Handle loading all substations
  const handleLoadAllSubstations = () => {
    clearError('loadAllSubstations');
    loadAllSubstationsMutation.mutate();
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
    errors, // Return all errors
    clearAllErrors, // Allow clearing all errors at once
  };
};
