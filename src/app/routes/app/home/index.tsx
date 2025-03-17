import React, { useState, useEffect } from 'react';
import EditorLayout from '@/components/layouts/editor';
import SingleLineDiagram from '@/features/diagram/components/single-line-diagram';
import { Search } from 'lucide-react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { fetch } from '@tauri-apps/plugin-http';

// Import shadcn/ui components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  const [lineId, setLineId] = useState<string>('VLGEN');
  const [inputValue, setInputValue] = useState<string>('VLGEN');
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

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setLineId(inputValue);
  };

  const handleItemClick = (id: string): void => {
    setLineId(id);
    setInputValue(id);
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
        {/* Left sidebar - exactly 1/4 width */}
        <div className="w-1/12 flex flex-col border-r border-gray-200 bg-white">
          <div className="p-2 border-b border-gray-200">
            <h2 className="font-semibold">Network Explorer</h2>
            <div className="mt-2 flex space-x-2">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="VLGEN"
                  className="h-8 text-sm w-full"
                />
              </div>
              <Button size="sm" className="h-8 text-sm" onClick={handleSubmit}>
                Search
              </Button>
            </div>
          </div>

          <div className="flex border-b border-gray-200">
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
                  <Collapsible
                    key={substation.id}
                    open={expandedSubstations[substation.id]}
                    className="border-0"
                  >
                    <CollapsibleTrigger
                      className="flex items-center w-full py-1 px-2 text-sm hover:bg-gray-100"
                      onClick={() => toggleSubstation(substation.id)}
                    >
                      {expandedSubstations[substation.id] ? (
                        <ChevronDown className="h-3 w-3 flex-shrink-0 mr-1" />
                      ) : (
                        <ChevronRight className="h-3 w-3 flex-shrink-0 mr-1" />
                      )}
                      <span className="font-medium truncate">
                        {substation.id} ({substation.country})
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="ml-5">
                      {voltagesBySubstation[substation.id]?.map((vl) => (
                        <div
                          key={vl.id}
                          className={`py-1 px-2 text-sm cursor-pointer ${
                            lineId === vl.id
                              ? 'bg-blue-100'
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={() => handleItemClick(vl.id)}
                        >
                          <span className="truncate block">
                            {vl.id} - {vl.nominal_v} kV
                          </span>
                        </div>
                      )) || (
                        <div className="text-xs p-2 text-gray-500">
                          No voltage levels
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {voltageLevels.map((vl) => (
                  <div
                    key={vl.id}
                    className={`py-1 px-2 text-sm cursor-pointer ${
                      lineId === vl.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => handleItemClick(vl.id)}
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

        {/* Main content - Takes remaining 3/4 */}
        <div className="w-11/12 flex flex-col overflow-hidden">
          <div className="p-4 bg-white border-b border-gray-200">
            <h2 className="text-lg font-medium">Diagram: {lineId}</h2>
          </div>
          <div className="flex-1 overflow-auto p-4 bg-gray-100">
            <div className="h-full w-full flex items-center justify-center bg-white border border-gray-200 rounded-md">
              <SingleLineDiagram
                lineId={lineId}
                className="w-auto h-auto max-w-full max-h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </EditorLayout>
  );
};

export default HomeRoute;
