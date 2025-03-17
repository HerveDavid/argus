import React, { useState, useEffect } from 'react';
import EditorLayout from '@/components/layouts/editor';
import SingleLineDiagram from '@/features/diagram/components/single-line-diagram';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { fetch } from '@tauri-apps/plugin-http';

// Import shadcn/ui components
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  getNoProxy,
  getProxyUrl,
} from '@/features/settings/proxy/stores/proxy.store';

// Define TypeScript interfaces
interface Substation {
  country: string;
  geo_tags: string;
  id: string;
  name: string;
  tso: string;
}

interface VoltageLevel {
  high_voltage_limit: number | null;
  id: string;
  low_voltage_limit: number | null;
  name: string;
  nominal_v: number;
  substation_id: string;
  topology_kind: string;
}

interface SubstationsResponse {
  substations: Substation[];
}

interface VoltageLevelsResponse {
  voltage_levels: VoltageLevel[];
}

interface ExpandedSubstations {
  [key: string]: boolean;
}

interface VoltagesBySubstation {
  [key: string]: VoltageLevel[];
}

interface FetchOptions {
  method: string;
  headers: Record<string, string>;
  proxy?: {
    all: {
      url: string;
      noProxy: string;
    };
  };
}

const HomeRoute: React.FC = () => {
  const [diagramId, setDiagramId] = useState<string>('VLGEN');
  const [diagramType, setDiagramType] = useState<'voltageLevel' | 'substation'>(
    'voltageLevel',
  );
  const [substations, setSubstations] = useState<Substation[]>([]);
  const [voltageLevels, setVoltageLevels] = useState<VoltageLevel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedSubstations, setExpandedSubstations] =
    useState<ExpandedSubstations>({});
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('substations');

  // Fetch data from API
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const proxyUrl = getProxyUrl();
        const noProxy = getNoProxy();

        const options: FetchOptions = {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        };

        if (proxyUrl) {
          options.proxy = {
            all: {
              url: proxyUrl,
              noProxy: noProxy || 'localhost',
            },
          };
        }

        // Fetch substations with error handling
        try {
          const substationsResponse = await fetch(
            'http://localhost:8000/api/v1/network/substations',
            options,
          );

          const substationsData: SubstationsResponse =
            await substationsResponse.json();

          setSubstations(substationsData.substations);

          // Initialize expanded state for all substations
          const expanded: ExpandedSubstations = {};
          substationsData.substations.forEach((sub) => {
            expanded[sub.id] = true;
          });
          setExpandedSubstations(expanded);
        } catch (substationError) {
          console.error('Error fetching substations:', substationError);
          setError('Failed to fetch substations. Check if the API is running.');

          // Use sample data as fallback
          const sampleSubstations: Substation[] = [
            {
              country: 'FR',
              geo_tags: 'A',
              id: 'P1',
              name: '',
              tso: 'RTE',
            },
            {
              country: 'FR',
              geo_tags: 'B',
              id: 'P2',
              name: '',
              tso: 'RTE',
            },
          ];
          setSubstations(sampleSubstations);

          // Initialize expanded state for fallback substations
          const expanded: ExpandedSubstations = {};
          sampleSubstations.forEach((sub) => {
            expanded[sub.id] = true;
          });
          setExpandedSubstations(expanded);
        }

        // Fetch voltage levels with error handling
        try {
          const voltageLevelsResponse = await fetch(
            'http://localhost:8000/api/v1/network/voltage-levels',
            options,
          );

          const voltageLevelsData: VoltageLevelsResponse =
            await voltageLevelsResponse.json();

          setVoltageLevels(voltageLevelsData.voltage_levels);
        } catch (voltageLevelError) {
          console.error('Error fetching voltage levels:', voltageLevelError);
          if (!error) {
            setError(
              'Failed to fetch voltage levels. Check if the API is running.',
            );
          }

          // Use sample data as fallback
          const sampleVoltageLevels: VoltageLevel[] = [
            {
              high_voltage_limit: null,
              id: 'VLGEN',
              low_voltage_limit: null,
              name: '',
              nominal_v: 24.0,
              substation_id: 'P1',
              topology_kind: '',
            },
            {
              high_voltage_limit: null,
              id: 'VLHV1',
              low_voltage_limit: null,
              name: '',
              nominal_v: 380.0,
              substation_id: 'P1',
              topology_kind: '',
            },
            {
              high_voltage_limit: null,
              id: 'VLHV2',
              low_voltage_limit: null,
              name: '',
              nominal_v: 380.0,
              substation_id: 'P2',
              topology_kind: '',
            },
            {
              high_voltage_limit: null,
              id: 'VLLOAD',
              low_voltage_limit: null,
              name: '',
              nominal_v: 150.0,
              substation_id: 'P2',
              topology_kind: '',
            },
          ];
          setVoltageLevels(sampleVoltageLevels);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error in data fetching process:', error);
        setError('An unexpected error occurred while fetching data.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group voltage levels by substation
  const voltagesBySubstation: VoltagesBySubstation = voltageLevels.reduce(
    (acc: VoltagesBySubstation, vl) => {
      if (!acc[vl.substation_id]) {
        acc[vl.substation_id] = [];
      }
      acc[vl.substation_id].push(vl);
      return acc;
    },
    {},
  );

  const handleItemClick = (
    id: string,
    type: 'voltageLevel' | 'substation',
  ): void => {
    setDiagramId(id);
    setDiagramType(type);
  };

  const toggleSubstation = (id: string): void => {
    setExpandedSubstations({
      ...expandedSubstations,
      [id]: !expandedSubstations[id],
    });
  };

  return (
    <EditorLayout>
      <div className="flex w-full h-full bg-gray-50">
        {/* Left sidebar - exactly 1/12 width */}
        <div className="w-1/12 flex flex-col border-r border-gray-200">
          <div className="flex flex-col border-b border-gray-200">
            <h2 className="font-semibold p-2 border-b">Network Explorer</h2>
            <div className="flex">
              <button
                className={`flex-1 py-1 text-sm ${
                  activeTab === 'substations' ? 'bg-gray-100 font-medium' : ''
                }`}
                onClick={() => setActiveTab('substations')}
              >
                Substations
              </button>
              <button
                className={`flex-1 py-1 text-sm ${
                  activeTab === 'voltages' ? 'bg-gray-100 font-medium' : ''
                }`}
                onClick={() => setActiveTab('voltages')}
              >
                Voltage Levels
              </button>
            </div>
          </div>

          {error && (
            <div className="p-2 m-2 text-xs bg-red-100 text-red-800 rounded-md">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p>Loading...</p>
              </div>
            ) : activeTab === 'substations' ? (
              <div className="space-y-1">
                {substations.map((substation) => (
                  <Card key={substation.id} className="p-0 shadow-sm">
                    <div
                      className={`cursor-pointer p-2 ${
                        diagramId === substation.id &&
                        diagramType === 'substation'
                          ? 'bg-blue-100'
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() =>
                        handleItemClick(substation.id, 'substation')
                      }
                    >
                      <div className="flex items-center">
                        <button
                          className="p-1 mr-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSubstation(substation.id);
                          }}
                        >
                          {expandedSubstations[substation.id] ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                        </button>
                        <span className="font-medium truncate text-sm">
                          {substation.id} ({substation.country})
                        </span>
                      </div>
                    </div>

                    <Collapsible
                      open={expandedSubstations[substation.id]}
                      className="border-t border-gray-100"
                    >
                      <CollapsibleContent className="p-0">
                        {voltagesBySubstation[substation.id]?.map((vl) => (
                          <div
                            key={vl.id}
                            className={`py-1 px-2 pl-6 text-sm cursor-pointer ${
                              diagramId === vl.id &&
                              diagramType === 'voltageLevel'
                                ? 'bg-blue-100'
                                : 'hover:bg-gray-100'
                            }`}
                            onClick={() =>
                              handleItemClick(vl.id, 'voltageLevel')
                            }
                          >
                            <span className="truncate block">
                              {vl.id} - {vl.nominal_v} kV
                            </span>
                          </div>
                        )) || (
                          <div className="text-xs p-2 pl-6 text-gray-500">
                            No voltage levels
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {voltageLevels.map((vl) => (
                  <div
                    key={vl.id}
                    className={`py-1 px-2 text-sm cursor-pointer ${
                      diagramId === vl.id && diagramType === 'voltageLevel'
                        ? 'bg-blue-100'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleItemClick(vl.id, 'voltageLevel')}
                  >
                    <div className="truncate">{vl.id}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {vl.nominal_v} kV
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main content - Takes remaining 11/12 */}
        <div className="w-11/12 flex flex-col overflow-hidden">
          {/* Align the header with the navigation tabs */}
          <div className="flex items-center border-b border-gray-200">
            <h2 className="font-semibold p-2">
              {diagramType === 'voltageLevel'
                ? `Voltage Level: ${diagramId}`
                : `Substation: ${diagramId}`}
            </h2>
          </div>
          <div className="flex-1 overflow-auto p-4 bg-secondary">
            <div className="h-full w-full flex items-center justify-center border border-gray-200 rounded-md bg-background">
              <SingleLineDiagram
                lineId={diagramId}
                className="w-auto h-auto max-w-full max-h-full bg-background"
              />
            </div>
          </div>
        </div>
      </div>
    </EditorLayout>
  );
};

export default HomeRoute;
