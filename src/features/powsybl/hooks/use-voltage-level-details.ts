import { useQuery } from '@tanstack/react-query';
import { getVoltageLevelById } from '../api/get-voltage-levels';

export const useVoltageLevelDetails = (voltageLevel?: string) => {
  const voltageLevelDetailsQuery = useQuery({
    queryKey: ['voltageLevel', voltageLevel],
    queryFn: async () => {
      if (!voltageLevel) return null;
      return await getVoltageLevelById(voltageLevel);
    },
    enabled: !!voltageLevel,
  });

  return voltageLevelDetailsQuery;
};
