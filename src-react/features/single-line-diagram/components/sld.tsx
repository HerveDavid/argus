import React, { useEffect } from 'react';

import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { useSldStore } from '../stores/sld.store';
import { useSvgRenderer } from '../hooks/use-svg-renderer';
import { LoadingState } from './loading-state';
import { ErrorState } from './error-state';
import { DiagramContent } from './diagram-content';
import { EmptyState } from './empty-state';
import { DiagramFooter } from './diagram-footer';

export interface SingleLineDiagramProps {
  id: string;
}

export const Sld: React.FC<SingleLineDiagramProps> = ({ id }) => {
  const {
    isLoading,
    isLoaded,
    isError,
    diagramData,
    error,
    loadDiagram,
    retry,
  } = useSldStore();

  const { svgRef } = useSvgRenderer(diagramData, isLoaded);

  useEffect(() => {
    if (id) {
      loadDiagram(id);
    }
  }, [id, loadDiagram]);

  const renderContent = () => {
    if (isLoading) return <LoadingState />;
    if (isError) return <ErrorState error={error} onRetry={retry} />;
    if (isLoaded && diagramData && diagramData.svg) {
      return <DiagramContent diagramData={diagramData} svgRef={svgRef} />;
    }
    return <EmptyState />;
  };

  return (
    <div className="h-full">
      <Card className="h-full flex flex-col border-0 rounded-none">
        <CardHeader>
          <CardTitle>
            <div className="flex items-center justify-between">
              <h1>{id}</h1>
            </div>
          </CardTitle>
          <CardAction />
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          {renderContent()}
        </CardContent>

        <CardFooter>
          <DiagramFooter
            isLoading={isLoading}
            isLoaded={isLoaded}
            isError={isError}
            diagramData={diagramData}
          />
        </CardFooter>
      </Card>
    </div>
  );
};
