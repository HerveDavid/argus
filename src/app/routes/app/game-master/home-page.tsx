import React, { useState, useEffect } from 'react';
import EditorLayout from '@/components/layouts/editor';
import SingleLineDiagram from '@/features/network/components/single-line-diagram';
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
} from '@/features/settings/components/proxy/stores/proxy.store';

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

const NetworkExplorer: React.FC = () => {
  const [lineId, setLineId] = useState<string>('VLGEN');
  const [inputValue, setInputValue] = useState<string>('VLGEN');
  const [substations, setSubstations] = useState<Substation[]>([]);
  const [voltageLevels, setVoltageLevels] = useState<VoltageLevel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedSubstations, setExpandedSubstations] =
    useState<ExpandedSubstations>({});
  const [error, setError] = useState<string | null>(null);

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
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar */}
        <div className="w-1/4 max-w-xs bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Network Explorer</h2>
          </div>

          <Tabs
            defaultValue="substations"
            className="flex-1 overflow-hidden flex flex-col"
          >
            <TabsList className="grid grid-cols-2 mx-2 my-2">
              <TabsTrigger value="substations">Substations</TabsTrigger>
              <TabsTrigger value="voltages">Voltage Levels</TabsTrigger>
            </TabsList>

            {error && (
              <div className="p-2 m-2 text-sm bg-red-100 text-red-800 rounded-md">
                {error}
              </div>
            )}

            <TabsContent
              value="substations"
              className="flex-1 overflow-y-auto p-2"
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p>Loading...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {substations.map((substation) => (
                    <Collapsible
                      key={substation.id}
                      open={expandedSubstations[substation.id]}
                      className="border rounded-md"
                    >
                      <CollapsibleTrigger
                        className="flex items-center justify-between w-full p-2 hover:bg-gray-100"
                        onClick={() => toggleSubstation(substation.id)}
                      >
                        <span className="font-medium">
                          {substation.id} ({substation.country})
                        </span>
                        {expandedSubstations[substation.id] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-4 pr-2 pb-2">
                        {voltagesBySubstation[substation.id]?.map((vl) => (
                          <div
                            key={vl.id}
                            className={`p-2 my-1 rounded cursor-pointer text-sm ${
                              lineId === vl.id
                                ? 'bg-blue-100 font-medium'
                                : 'hover:bg-gray-100'
                            }`}
                            onClick={() => handleItemClick(vl.id)}
                          >
                            {vl.id} - {vl.nominal_v} kV
                          </div>
                        )) || (
                          <div className="text-sm p-2 text-gray-500">
                            No voltage levels
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="voltages"
              className="flex-1 overflow-y-auto p-2"
            >
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p>Loading...</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {voltageLevels.map((vl) => (
                    <div
                      key={vl.id}
                      className={`p-2 rounded cursor-pointer ${
                        lineId === vl.id
                          ? 'bg-blue-100 font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => handleItemClick(vl.id)}
                    >
                      <div>{vl.id}</div>
                      <div className="text-xs text-gray-500">
                        Substation: {vl.substation_id} • {vl.nominal_v} kV
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 bg-white border-b border-gray-200">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <div className="relative grow">
                <Input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter a lineId (e.g. VLGEN)"
                  className="pl-10 w-full"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <Button type="submit" className="shrink-0">
                Search
              </Button>
            </form>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <Card className="shadow-md h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">
                  Diagram: {lineId}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center">
                <SingleLineDiagram
                  lineId={lineId}
                  className="w-auto h-auto max-w-full max-h-full"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </EditorLayout>
  );
};

export default NetworkExplorer;
