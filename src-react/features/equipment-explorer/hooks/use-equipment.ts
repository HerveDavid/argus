import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { Effect } from 'effect';
import { ProjectClient } from '@/services/common/project-client';
import { useRuntime } from '@/services/runtime/use-runtime';
import {
  SubstationQueryParams,
  SubstationQueryResponse,
} from '../types/equipment-query.type';
import { Substation } from '@/types/substation';

export const useEquipment = (
  params: SubstationQueryParams,
  options?: UseQueryOptions<SubstationQueryResponse>,
) => {
  const runtime = useRuntime();

  return useQuery({
    queryKey: ['substations', params],
    queryFn: async (): Promise<SubstationQueryResponse> => {
      const program = Effect.gen(function* () {
        const projectClient = yield* ProjectClient;

        // Construction des conditions de filtrage
        const conditions: string[] = [];

        if (params.search) {
          // Échapper les caractères spéciaux pour ILIKE
          const escapedSearch = params.search.replace(/'/g, "''");
          conditions.push(`
            (s.id ILIKE '%${escapedSearch}%' 
             OR s.name ILIKE '%${escapedSearch}%' 
             OR s.country ILIKE '%${escapedSearch}%' 
             OR s.tso ILIKE '%${escapedSearch}%'
             OR EXISTS (
               SELECT 1 FROM voltage_levels vl_search 
               WHERE vl_search.substation_id = s.id 
               AND vl_search.fictitious = FALSE
               AND (vl_search.id ILIKE '%${escapedSearch}%' 
                    OR vl_search.topology_kind ILIKE '%${escapedSearch}%')
             ))
          `);
        }

        if (params.country) {
          conditions.push(
            `s.country = '${params.country.replace(/'/g, "''")}'`,
          );
        }

        if (params.tso) {
          conditions.push(`s.tso = '${params.tso.replace(/'/g, "''")}'`);
        }

        // Clause WHERE de base (toujours exclure les substations fictives)
        let whereClause = 'WHERE s.fictitious = FALSE';

        if (conditions.length > 0) {
          whereClause += ` AND (${conditions.join(' AND ')})`;
        }

        // Requête pour obtenir le nombre total avec les mêmes filtres
        const countQuery = `
          SELECT COUNT(DISTINCT s.id) as total 
          FROM substations s 
          ${whereClause}
        `;

        const countResult = yield* projectClient.queryProject(countQuery);
        const total = countResult.data[0]?.total || 0;

        // Calcul de la pagination
        const offset = (params.page - 1) * params.pageSize;

        // Requête principale avec agrégation des voltage levels
        const mainQuery = `
          SELECT 
            s.id as substation_id,
            s.name as substation_name,
            s.tso,
            s.geo_tags,
            s.country,
            s.fictitious,
            COALESCE(
              LIST(
                STRUCT_PACK(
                  id := vl.id,
                  name := vl.name,
                  substation_id := vl.substation_id,
                  nominal_v := vl.nominal_v,
                  high_voltage_limit := vl.high_voltage_limit,
                  low_voltage_limit := vl.low_voltage_limit,
                  fictitious := vl.fictitious,
                  topology_kind := vl.topology_kind
                ) ORDER BY vl.nominal_v DESC
              ) FILTER (WHERE vl.id IS NOT NULL),
              []
            ) as voltage_levels
          FROM substations s
          LEFT JOIN voltage_levels vl ON s.id = vl.substation_id 
            AND vl.fictitious = FALSE
          ${whereClause}
          GROUP BY s.id, s.name, s.tso, s.geo_tags, s.country, s.fictitious
          ORDER BY s.id
          LIMIT ${params.pageSize} OFFSET ${offset}
        `;

        const result = yield* projectClient.queryProject(mainQuery);

        // Transformation des données - gestion du type STRUCT[] de DuckDB
        const substations: Substation[] = yield* Effect.all(
          result.data.map((row: any) =>
            Effect.gen(function* () {
              // Gestion du type STRUCT[] de DuckDB pour voltage_levels
              let voltageLevels: any[] = [];

              if (row.voltage_levels) {
                if (Array.isArray(row.voltage_levels)) {
                  // Déjà un tableau
                  voltageLevels = row.voltage_levels;
                } else if (typeof row.voltage_levels === 'string') {
                  // DuckDB retourne souvent les STRUCT[] comme string avec guillemets simples
                  try {
                    // Convertir les guillemets simples en guillemets doubles pour JSON.parse
                    const jsonString = row.voltage_levels
                      .replace(/'/g, '"')
                      .replace(/NULL/g, 'null')
                      .replace(/True/g, 'true')
                      .replace(/False/g, 'false');

                    voltageLevels = JSON.parse(jsonString);
                  } catch (e) {
                    // Si le parsing JSON échoue, essayons une approche alternative
                    // Chercher les objets dans la chaîne
                    try {
                      const regex = /\{[^}]+\}/g;
                      const matches = row.voltage_levels.match(regex);
                      if (matches) {
                        voltageLevels = matches.map((match: string) => {
                          // Parser manuellement chaque objet
                          const obj: any = {};
                          const keyValueRegex = /'([^']+)':\s*([^,}]+)/g;
                          let keyValueMatch;

                          while (
                            (keyValueMatch = keyValueRegex.exec(match)) !== null
                          ) {
                            const key = keyValueMatch[1];
                            const rawValue = keyValueMatch[2].trim();

                            // Fonction helper pour parser avec le bon type
                            const parseValue = (val: string): any => {
                              if (val === 'NULL') return null;
                              if (val === 'true' || val === 'True') return true;
                              if (val === 'false' || val === 'False')
                                return false;
                              if (val.startsWith("'") && val.endsWith("'"))
                                return val.slice(1, -1);
                              if (!isNaN(Number(val))) return Number(val);
                              return val;
                            };

                            obj[key] = parseValue(rawValue);
                          }

                          return obj;
                        });
                      }
                    } catch (e2) {
                      voltageLevels = [];
                    }
                  }
                } else if (typeof row.voltage_levels === 'object') {
                  // Peut être un objet avec des propriétés numériques (DuckDB STRUCT[])
                  voltageLevels = Object.values(row.voltage_levels).filter(
                    (v) => v !== null && v !== undefined,
                  );
                }
              }

              // Assurer que c'est un tableau et filtrer les éléments valides
              if (!Array.isArray(voltageLevels)) {
                voltageLevels = [];
              }

              const mappedVoltageLevels = voltageLevels
                .filter((vl: any) => {
                  const isValid = vl && typeof vl === 'object' && vl.id;
                  return isValid;
                })
                .map((vl: any) => {
                  const mapped = {
                    id: vl.id,
                    name: vl.name || '',
                    substation_id: vl.substation_id || row.substation_id,
                    nominal_v: vl.nominal_v || 0,
                    high_voltage_limit: vl.high_voltage_limit || 0,
                    low_voltage_limit: vl.low_voltage_limit || 0,
                    fictitious: vl.fictitious || false,
                    topology_kind: vl.topology_kind || 'unknown',
                  };
                  return mapped;
                })
                // Tri par tension décroissante (déjà fait en SQL mais on s'assure)
                .sort(
                  (a: any, b: any) => (b.nominal_v || 0) - (a.nominal_v || 0),
                );

              const substation = {
                id: row.substation_id,
                name: row.substation_name || '',
                tso: row.tso || '',
                geo_tags: row.geo_tags || '',
                country: row.country || '',
                fictitious: row.fictitious || false,
                voltage_levels: mappedVoltageLevels,
              };

              return substation;
            }),
          ),
        );

        const totalPages = Math.ceil(total / params.pageSize);

        return {
          substations,
          total,
          page: params.page,
          pageSize: params.pageSize,
          totalPages,
        };
      });

      return runtime.runPromise(program);
    },
    // Options par défaut
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
};

// Hook utilitaire pour obtenir la liste des pays disponibles
export const useAvailableCountries = () => {
  const runtime = useRuntime();

  return useQuery({
    queryKey: ['substations', 'countries'],
    queryFn: async (): Promise<string[]> => {
      const program = Effect.gen(function* () {
        const projectClient = yield* ProjectClient;

        const query = `
          SELECT DISTINCT country
          FROM substations 
          WHERE country IS NOT NULL 
            AND country != ''
            AND fictitious = FALSE
          ORDER BY country
        `;

        const result = yield* projectClient.queryProject(query);
        return result.data.map((row: any) => row.country);
      });

      return runtime.runPromise(program);
    },
    staleTime: 15 * 60 * 1000, // 15 minutes (les pays changent rarement)
  });
};

// Hook utilitaire pour obtenir la liste des TSO disponibles
export const useAvailableTSOs = () => {
  const runtime = useRuntime();

  return useQuery({
    queryKey: ['substations', 'tsos'],
    queryFn: async (): Promise<string[]> => {
      const program = Effect.gen(function* () {
        const projectClient = yield* ProjectClient;

        const query = `
          SELECT DISTINCT tso
          FROM substations 
          WHERE tso IS NOT NULL 
            AND tso != ''
            AND fictitious = FALSE
          ORDER BY tso
        `;

        const result = yield* projectClient.queryProject(query);
        return result.data.map((row: any) => row.tso);
      });

      return runtime.runPromise(program);
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Hook pour obtenir les statistiques globales
export const useEquipmentStats = () => {
  const runtime = useRuntime();

  return useQuery({
    queryKey: ['substations', 'stats'],
    queryFn: async () => {
      const program = Effect.gen(function* () {
        const projectClient = yield* ProjectClient;

        const query = `
          SELECT 
            COUNT(DISTINCT s.id) as total_substations,
            COUNT(DISTINCT vl.id) as total_voltage_levels,
            COUNT(DISTINCT s.country) as countries_count,
            COUNT(DISTINCT s.tso) as tso_count,
            MIN(vl.nominal_v) as min_voltage,
            MAX(vl.nominal_v) as max_voltage,
            AVG(vl.nominal_v) as avg_voltage
          FROM substations s
          LEFT JOIN voltage_levels vl ON s.id = vl.substation_id 
            AND vl.fictitious = FALSE
          WHERE s.fictitious = FALSE
        `;

        const result = yield* projectClient.queryProject(query);
        return result.data[0] || {};
      });

      return runtime.runPromise(program);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
