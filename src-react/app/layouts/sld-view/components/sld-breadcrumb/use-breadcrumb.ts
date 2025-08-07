import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { Effect } from 'effect';

import { PowsyblClient } from '@/services/common/powsybl-client';
import { useRuntime } from '@/services/runtime/use-runtime.tsx';

export interface BreadcrumbItem {
  id: string;
  name: string;
  type: 'country' | 'tso' | 'substation' | 'voltage_level';
}

export interface BreadcrumbResponse {
  items: BreadcrumbItem[];
  fullPath: string;
}

export const useBreadcrumb = (
  elementId: string,
  options?: UseQueryOptions<BreadcrumbResponse>,
) => {
  const runtime = useRuntime();

  return useQuery({
    queryKey: ['breadcrumb', elementId],
    queryFn: async (): Promise<BreadcrumbResponse> => {
      const program = Effect.gen(function* () {
        const powsyblClient = yield* PowsyblClient;

        const query = `
          WITH input AS (SELECT ? as search_id)
          SELECT id,
                 breadcrumb,
                 element_type,
                 country,
                 tso,
                 substation_id,
                 substation_name,
                 voltage_level_name
          FROM (SELECT vl.id,
                       CASE
                         WHEN s.tso IS NOT NULL AND s.tso != '' 
                THEN CONCAT(s.country, ' > ', s.tso, ' > ', s.id, ' > ', vl.id)
                         ELSE CONCAT(s.country, ' > ', s.id, ' > ', vl.id)
                         END           as breadcrumb,
                       'voltage_level' as element_type,
                       s.country,
                       s.tso,
                       s.id            as substation_id,
                       s.name          as substation_name,
                       vl.name         as voltage_level_name
                FROM voltage_levels vl
                       JOIN substations s ON vl.substation_id = s.id
                       CROSS JOIN input
                WHERE vl.id = input.search_id
                UNION ALL
                SELECT s.id,
                       CASE
                         WHEN s.tso IS NOT NULL AND s.tso != '' 
                THEN CONCAT(s.country, ' > ', s.tso, ' > ', s.id)
                         ELSE CONCAT(s.country, ' > ', s.id)
                         END        as breadcrumb,
                       'substation' as element_type,
                       s.country,
                       s.tso,
                       s.id         as substation_id,
                       s.name       as substation_name,
                       NULL         as voltage_level_name
                FROM substations s
                       CROSS JOIN input
                WHERE s.id = input.search_id) t
          WHERE t.id IS NOT NULL
        `;

        const result = yield* powsyblClient.executeQuery({
          query,
          parameters: [elementId],
          limit: 1,
        });

        if (!result.success || !result.data || result.data.length === 0) {
          // Fallback si aucune donnée trouvée
          return {
            items: [
              {
                id: elementId,
                name: elementId,
                type: 'voltage_level' as const,
              },
            ],
            fullPath: elementId,
          };
        }

        const data = result.data[0];
        const breadcrumbItems: BreadcrumbItem[] = [];

        // Construire les items du breadcrumb
        if (data.country) {
          breadcrumbItems.push({
            id: data.country,
            name: data.country,
            type: 'country',
          });
        }

        if (data.tso && data.tso.trim() !== '') {
          breadcrumbItems.push({
            id: data.tso,
            name: data.tso,
            type: 'tso',
          });
        }

        if (data.substation_id) {
          breadcrumbItems.push({
            id: data.substation_id,
            name: data.substation_name || data.substation_id,
            type: 'substation',
          });
        }

        if (data.element_type === 'voltage_level') {
          breadcrumbItems.push({
            id: data.id,
            name: data.voltage_level_name || data.id,
            type: 'voltage_level',
          });
        }

        return {
          items: breadcrumbItems,
          fullPath: data.breadcrumb || elementId,
        };
      });

      // @ts-ignore
      return runtime.runPromise(program);
    },
    enabled: !!elementId, // Ne pas exécuter si pas d'elementId
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
};

// Hook utilitaire pour parser un breadcrumb string
export const useParseBreadcrumb = (breadcrumbString?: string) => {
  if (!breadcrumbString) return [];

  return breadcrumbString
    .split(' > ')
    .filter((item) => item.trim() !== '')
    .map((item, index, array) => {
      // Déterminer le type basé sur la position
      let type: BreadcrumbItem['type'] = 'country';

      if (index === array.length - 1) {
        // Le dernier élément peut être substation ou voltage_level
        type = array.length > 2 ? 'voltage_level' : 'substation';
      } else if (index === array.length - 2 && array.length > 2) {
        type = 'substation';
      } else if (index === 1) {
        type = 'tso';
      }

      return {
        id: item.trim(),
        name: item.trim(),
        type,
      };
    });
};

// Hook pour obtenir le parent direct d'un élément
export const useParentElement = (elementId: string) => {
  const { data: breadcrumb } = useBreadcrumb(elementId);

  if (!breadcrumb || breadcrumb.items.length <= 1) {
    return null;
  }

  // Retourner l'avant-dernier élément (parent direct)
  return breadcrumb.items[breadcrumb.items.length - 2] || null;
};
