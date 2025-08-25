import { useDiagram } from '../providers/diagram.provider';

export const DiagramContent = () => {
  const { elementId, svgRef, isLoaded, isInitialized, svgContent } =
    useDiagram();

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-hidden bg-background border-0 rounded">
        <div className="mb-2">
          Element ID: {elementId} | Loaded: {isLoaded ? 'Yes' : 'No'} |
          Initialized: {isInitialized ? 'Yes' : 'No'} | Has Content:{' '}
          {svgContent ? 'Yes' : 'No'}
        </div>
        <svg
          ref={svgRef}
          className="w-full h-full cursor-default"
          style={{ minHeight: '400px' }}
        />
      </div>
    </div>
  );
};
