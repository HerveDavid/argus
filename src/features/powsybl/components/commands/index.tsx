import { useState } from 'react';
import { useDiagramStore } from '../../stores/use-diagram.store';
import { breaker_events } from './breaker_events';
import { load_reductions } from './load-reduction';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface CommandsProps {
  lineId?: string;
}

const inputs = ['GeneratorDeltaP_BLAYA7GR1', 'GeneratorDeltaP_BLAYA7GR4'];

export const Commands: React.FC<CommandsProps> = () => {
  const { metadata } = useDiagramStore();
  const [switchStates, setSwitchStates] = useState({});
  const [sliderValues, setSliderValues] = useState(
    inputs.reduce((acc, input) => ({ ...acc, [input]: 0 }), {}),
  );

  // Initialize state for load reductions
  const [loadReductionValues, setLoadReductionValues] = useState(
    load_reductions.reduce((acc, item) => ({ ...acc, [item]: 0 }), {}),
  );

  // Format pour l'envoi à l'orchestrateur
  const getMessagePayload = (id, value) => {
    return JSON.stringify({ [id]: value });
  };

  const handleSwitchChange = (id) => {
    setSwitchStates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSliderChange = (id, value) => {
    setSliderValues((prev) => ({
      ...prev,
      [id]: value[0], // Slider renvoie un tableau de valeurs
    }));
  };

  const handleLoadReductionChange = (id, checked) => {
    // Si le switch est activé, on définit la valeur à -0.05, sinon à 0
    const newValue = checked ? -0.05 : 0;
    setLoadReductionValues((prev) => ({
      ...prev,
      [id]: newValue,
    }));
  };

  if (!metadata) {
    return <div>Loading</div>;
  }

  return (
    <div className="w-full h-full p-4">
      {/* Conteneur flex pour les trois cartes côte à côte */}
      <div className="flex flex-row gap-4 h-full">
        {/* Première carte - Circuit Breaker Commands */}
        <div className="flex-1">
          <Card className="h-full">
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-medium text-gray-800">
                Circuit Breaker Commands
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96 overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Breaker ID</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {breaker_events.map((id, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={!!switchStates[id]}
                              onCheckedChange={() => handleSwitchChange(id)}
                            />
                            <Badge
                              variant={
                                switchStates[id] ? 'success' : 'secondary'
                              }
                            >
                              {switchStates[id] ? 'Open' : 'Close'}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deuxième carte - Generator Active Power Controls */}
        <div className="flex-1">
          <Card className="h-full">
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-medium text-gray-800">
                Generator Active Power Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96 overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Generator ID</TableHead>
                      <TableHead>Active Power Value</TableHead>
                      <TableHead>Control</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inputs.map((id, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{sliderValues[id].toFixed(2)}</span>
                            <Badge variant="outline" className="text-xs">
                              {sliderValues[id] === 0
                                ? 'P=Pmax (No change)'
                                : sliderValues[id] === -1
                                ? 'P=0 (Full reduction)'
                                : `${Math.abs(sliderValues[id] * 100).toFixed(
                                    0,
                                  )}% reduction`}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="w-64">
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[sliderValues[id]]}
                              min={-1}
                              max={0}
                              step={0.01}
                              onValueChange={(value) =>
                                handleSliderChange(id, value)
                              }
                              className="w-full"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Troisième carte - Load Reductions */}
        <div className="flex-1">
          <Card className="h-full">
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-medium text-gray-800">
                Load Reductions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96 overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Load ID</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Control</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {load_reductions.map((id, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{loadReductionValues[id].toFixed(2)}</span>
                            <Badge variant="outline" className="text-xs">
                              {loadReductionValues[id] === 0
                                ? 'No change'
                                : '5% reduction'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="w-64">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={loadReductionValues[id] === -0.05}
                                onCheckedChange={(checked) =>
                                  handleLoadReductionChange(id, checked)
                                }
                              />
                              <span className="text-sm">
                                {loadReductionValues[id] === 0
                                  ? 'Normal'
                                  : 'Reduce 5%'}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
