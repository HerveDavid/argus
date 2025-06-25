import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { Effect } from 'effect';
import { ProjectClient } from '@/services/common/project-client';
import { useRuntime } from '@/services/runtime/use-runtime';
import { SubstationQueryParams, SubstationQueryResponse, Substation } from '../types/equipment.type';

export const useEquipment = (
  params: SubstationQueryParams,
  options?: UseQueryOptions<SubstationQueryResponse>
) => {
  const runtime = useRuntime();

  return useQuery({
    queryKey: ['substations', params],
    queryFn: async (): Promise<SubstationQueryResponse> => {
      const program = Effect.gen(function* () {
        const projectClient = yield* ProjectClient;
        
        // Construction de la requête SQL avec pagination et filtres
        const offset = (params.page - 1) * params.pageSize;
        let whereClause = '';
        const conditions: string[] = [];
        
        if (params.search) {
          conditions.push(`(s.name ILIKE '%${params.search}%' OR s.id ILIKE '%${params.search}%')`);
        }
        
        if (params.country) {
          conditions.push(`s.country = '${params.country}'`);
        }
        
        if (params.tso) {
          conditions.push(`s.tso = '${params.tso}'`);
        }
        
        if (conditions.length > 0) {
          whereClause = `WHERE ${conditions.join(' AND ')}`;
        }

        // Requête pour obtenir le nombre total
        const countQuery = `
          SELECT COUNT(*) as total 
          FROM substations s 
          ${whereClause}
        `;
        
        const countResult = yield* projectClient.queryProject(countQuery);
        const total = countResult.data[0]?.total || 0;

        // Requête principale avec les données des substations et leurs niveaux de tension
        const mainQuery = `
          SELECT 
            s.id,
            s.name,
            s.tso,
            s.geo_tags,
            s.country,
            s.fictitious,
            vl.id as vl_id,
            vl.name as vl_name,
            vl.nominal_v,
            vl.high_voltage_limit,
            vl.low_voltage_limit,
            vl.fictitious as vl_fictitious,
            vl.topology_kind
          FROM substations s
          LEFT JOIN voltage_levels vl ON s.id = vl.substation_id
          ${whereClause}
          ORDER BY s.name, COALESCE(vl.nominal_v, 0) DESC
          LIMIT ${params.pageSize} OFFSET ${offset}
        `;

        const result = yield* projectClient.queryProject(mainQuery);
        
        // Transformation des données pour grouper les voltage levels par substation
        const substationsMap = new Map<string, Substation>();
        
        result.data.forEach((row: any) => {
          if (!substationsMap.has(row.id)) {
            substationsMap.set(row.id, {
              id: row.id,
              name: row.name,
              tso: row.tso,
              geo_tags: row.geo_tags,
              country: row.country,
              fictitious: row.fictitious,
              voltage_levels: []
            });
          }
          
          const substation = substationsMap.get(row.id)!;
          
          if (row.vl_id) {
            substation.voltage_levels.push({
              id: row.vl_id,
              name: row.vl_name,
              substation_id: row.id,
              nominal_v: row.nominal_v,
              high_voltage_limit: row.high_voltage_limit,
              low_voltage_limit: row.low_voltage_limit,
              fictitious: row.vl_fictitious,
              topology_kind: row.topology_kind
            });
          }
        });

        const substations = Array.from(substationsMap.values());
        const totalPages = Math.ceil(total / params.pageSize);

        return {
          substations,
          total,
          page: params.page,
          pageSize: params.pageSize,
          totalPages
        };
      });

      return runtime.runPromise(program);
    },
    ...options
  });
};