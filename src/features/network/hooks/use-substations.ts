import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPaginatedSubstations,
  loadSubstations,
} from '../api/get-substations';

export const useSubstations = (initialItemsPerPage = 20) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(initialItemsPerPage);

  const queryClient = useQueryClient();

  const initialDataCheck = useQuery({
    queryKey: ['substationsCheck'],
    queryFn: async () => {
      const result = await getPaginatedSubstations({
        page: 1,
        per_page: 1,
      });
      return result.total > 0;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const substationsQuery = useQuery({
    queryKey: ['substations', currentPage, itemsPerPage],
    queryFn: async () => {
      return await getPaginatedSubstations({
        page: currentPage,
        per_page: itemsPerPage,
      });
    },
    enabled: initialDataCheck.data === true,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const loadAllSubstationsMutation = useMutation({
    mutationFn: loadSubstations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['substationsCheck'] });
      queryClient.invalidateQueries({ queryKey: ['substations'] });
      setCurrentPage(1);
    },
  });

  const handleLoadAllSubstations = () => {
    loadAllSubstationsMutation.mutate();
  };

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
  };
};
