import React from 'react';
import { DiagramProvider } from '../providers/diagram.provider';
import { DiagramContent } from './diagram-content';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { DiagramHeader } from '../components/diagram-header';
import { SldProvider } from '../providers/sld.provider';

interface SingleLineDiagramProps {
  id: string;
}

export const SingleLineDiagram: React.FC<SingleLineDiagramProps> = ({ id }) => {
  const hasDataRef = React.useRef(false);

  return (
    <SldProvider id={id}>
      <div>
        <Card className="h-full flex flex-col border-0 rounded-none p-2 gap-2">
          <CardHeader className="p-0 gap-0">
            <DiagramHeader id={id} hasDataRef={hasDataRef} />
          </CardHeader>
          <DiagramProvider elementId={id} key={id}>
            <CardContent className="flex-1 overflow-hidden p-0 m-0">
              <div className="relative h-full">
                <DiagramContent />
              </div>
            </CardContent>
          </DiagramProvider>
          <CardFooter className="p-0"></CardFooter>
        </Card>
      </div>
    </SldProvider>
  );
};
