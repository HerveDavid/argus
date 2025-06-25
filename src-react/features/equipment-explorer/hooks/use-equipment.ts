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

        // Requête pour obtenir le nombre total (avec les mêmes filtres)
        const countQuery = `
          SELECT COUNT(*) as total 
          FROM substations s 
          WHERE s.fictitious = FALSE
          ${whereClause ? `AND (${whereClause.replace('WHERE ', '')})` : ''}
        `;
        
        const countResult = yield* projectClient.queryProject(countQuery);
        const total = countResult.data[0]?.total || 0;

        // Requête principale avec les données des substations et leurs niveaux de tension
        const mainQuery = `
          SELECT 
            s.id as substation_id,
            s.name as substation_name,
            s.tso,
            s.geo_tags,
            s.country,
            s.fictitious,
            LIST(
              STRUCT_PACK(
                id := vl.id,
                name := vl.name,
                nominal_voltage := vl.nominal_v,
                high_limit := vl.high_voltage_limit,
                low_limit := vl.low_voltage_limit,
                topology := vl.topology_kind,
                fictitious := vl.fictitious
              )
            ) as voltage_levels
          FROM substations s
          LEFT JOIN voltage_levels vl ON s.id = vl.substation_id
          WHERE s.fictitious = FALSE 
            AND (vl.fictitious = FALSE OR vl.fictitious IS NULL)
            ${whereClause ? `AND (${whereClause.replace('WHERE ', '')})` : ''}
          GROUP BY s.id, s.name, s.tso, s.geo_tags, s.country, s.fictitious
          ORDER BY s.name
          LIMIT ${params.pageSize} OFFSET ${offset}
        `;

        const result = yield* projectClient.queryProject(mainQuery);
        
        // Transformation des données - gestion du type struct[] de DuckDB
        const substations: Substation[] = result.data.map((row: any) => {
          // Gestion du type struct[] de DuckDB
          let voltageLevels: any[] = [];
          
          if (row.voltage_levels) {
            if (Array.isArray(row.voltage_levels)) {
              // Déjà un tableau
              voltageLevels = row.voltage_levels;
            } else if (typeof row.voltage_levels === 'object') {
              // Peut être un objet avec des propriétés numériques (DuckDB struct[])
              voltageLevels = Object.values(row.voltage_levels).filter(v => v !== null && v !== undefined);
            } else if (typeof row.voltage_levels === 'string') {
              // Chaîne JSON
              try {
                voltageLevels = JSON.parse(row.voltage_levels);
              } catch {
                voltageLevels = [];
              }
            }
          }

          // Assurer que c'est un tableau et filtrer les éléments valides
          if (!Array.isArray(voltageLevels)) {
            voltageLevels = [];
          }

          return {
            id: row.substation_id,
            name: row.substation_name,
            tso: row.tso,
            geo_tags: row.geo_tags,
            country: row.country,
            fictitious: row.fictitious,
            voltage_levels: voltageLevels
              .filter((vl: any) => vl && typeof vl === 'object' && vl.id) 
              .map((vl: any) => ({
                id: vl.id,
                name: vl.name || '',
                substation_id: row.substation_id,
                nominal_v: vl.nominal_voltage,
                high_voltage_limit: vl.high_limit,
                low_voltage_limit: vl.low_limit,
                fictitious: vl.fictitious || false,
                topology_kind: vl.topology || 'unknown'
              }))
              .sort((a: any, b: any) => (b.nominal_v || 0) - (a.nominal_v || 0))
          };
        });
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