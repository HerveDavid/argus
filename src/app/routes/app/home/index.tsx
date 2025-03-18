import React, { useState, useEffect } from 'react';
import EditorLayout from '@/components/layouts/editor';
import SingleLineDiagram from '@/features/network/components/single-line-diagram';
import { ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';

// Import shadcn/ui components
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { fetchSubstations } from '@/features/network/api/get-substations';
import { fetchVoltageLevels } from '@/features/network/api/get-voltage-levels';
import { VoltageLevel } from '@/features/network/types/voltage-level.type';
import { Substation } from '@/features/network/types/substation.type';

interface ExpandedSubstations {
  [key: string]: boolean;
}

interface VoltagesBySubstation {
  [key: string]: VoltageLevel[];
}

const HomeRoute: React.FC = () => {
  const [diagramId, setDiagramId] = useState<string>();
  const [diagramType, setDiagramType] = useState<'voltageLevel' | 'substation'>(
    'voltageLevel',
  );
  const [substations, setSubstations] = useState<Substation[]>([]);
  const [voltageLevels, setVoltageLevels] = useState<VoltageLevel[]>([]);
  const [loadingSubstations, setLoadingSubstations] = useState<boolean>(true);
  const [loadingVoltageLevels, setLoadingVoltageLevels] = useState<boolean>(true);
  const [expandedSubstations, setExpandedSubstations] =
    useState<ExpandedSubstations>({});
  const [substationsError, setSubstationsError] = useState<string | null>(null);
  const [voltageLevelsError, setVoltageLevelsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('substations');

  // Separate fetch functions for better error handling
  const loadSubstations = async () => {
    try {
      setLoadingSubstations(true);
      setSubstationsError(null);
      const substationsData = await fetchSubstations();
      
      setSubstations(substationsData);

      // Initialize expanded state for all substations
      const expanded: ExpandedSubstations = {};
      substationsData.forEach((sub) => {
        expanded[sub.id] = true;
      });
      setExpandedSubstations(expanded);
    } catch (error) {
      console.error('Error fetching substations:', error);
      setSubstationsError(`Failed to fetch substations: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoadingSubstations(false);
    }
  };

  const loadVoltageLevels = async () => {
    try {
      setLoadingVoltageLevels(true);
      setVoltageLevelsError(null);
      const voltageLevelsData = await fetchVoltageLevels();
      
      // Check for expected data structure
      if (voltageLevelsData && voltageLevelsData.voltage_levels) {
        setVoltageLevels(voltageLevelsData.voltage_levels);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Error fetching voltage levels:', error);
      setVoltageLevelsError(`Failed to fetch voltage levels: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoadingVoltageLevels(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    loadSubstations();
    loadVoltageLevels();
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

  const renderError = (error: string | null, retryFunction: () => void) => {
    if (!error) return null;
    
    return (
      <Alert variant="destructive" className="m-2">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs flex items-center justify-between">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={retryFunction}
            className="ml-2 h-6 text-xs"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <EditorLayout>
      <div className="flex w-full h-full bg-gray-50">
        {/* Left sidebar - exactly 1/12 width */}
        <div className="w-2/12 flex flex-col border-r border-gray-200">
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

          {renderError(substationsError, loadSubstations)}
          {renderError(voltageLevelsError, loadVoltageLevels)}

          <div className="flex-1 overflow-y-auto p-2">
            {activeTab === 'substations' ? (
              loadingSubstations ? (
                <div className="flex items-center justify-center h-full">
                  <p>Loading substations...</p>
                </div>
              ) : substations.length === 0 ? (
                <div className="text-center p-4 text-gray-500">
                  {substationsError ? 'Error loading substations' : 'No substations found'}
                </div>
              ) : (
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
              )
            ) : loadingVoltageLevels ? (
              <div className="flex items-center justify-center h-full">
                <p>Loading voltage levels...</p>
              </div>
            ) : voltageLevels.length === 0 ? (
              <div className="text-center p-4 text-gray-500">
                {voltageLevelsError ? 'Error loading voltage levels' : 'No voltage levels found'}
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
        <div className="w-10/12 flex flex-col overflow-hidden">
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