import { useQuery } from '@tanstack/react-query';
import { Effect } from 'effect';
import { ProjectClient } from '@/services/common/project-client';
import { useRuntime } from '@/services/runtime/use-runtime';

export const useEquipmentFilters = () => {
  const runtime = useRuntime();

  return useQuery({
    queryKey: ['equipment-filters'],
    queryFn: async () => {
      const program = Effect.gen(function* () {
        const projectClient = yield* ProjectClient;
        
        // Récupérer les pays disponibles
        const countriesResult = yield* projectClient.queryProject(`
          SELECT DISTINCT country 
          FROM substations 
          WHERE country IS NOT NULL 
          ORDER BY country
        `);
        
        // Récupérer les TSO disponibles
        const tsoResult = yield* projectClient.queryProject(`
          SELECT DISTINCT tso 
          FROM substations 
          WHERE tso IS NOT NULL 
          ORDER BY tso
        `);

        return {
          countries: countriesResult.data.map((row: any) => row.country),
          tsos: tsoResult.data.map((row: any) => row.tso)
        };
      });

      return runtime.runPromise(program);
    }
  });
};