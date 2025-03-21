import { useQuery } from '@tanstack/react-query';
import { getSubstationById } from '../api/get-substations';

export const useSubstationDetails = (substationId?: string) => {
  const substationDetailsQuery = useQuery({
    queryKey: ['substation', substationId],
    queryFn: async () => {
      if (!substationId) return null;
      return await getSubstationById(substationId);
    },
    enabled: !!substationId,
  });

  return substationDetailsQuery;
};
