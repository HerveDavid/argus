// components/TimelineComponent.tsx
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import TimelineVisualization from './timeline-visualization';
import TimelineControls from './timeline-controls';
import { useTimelineInitialization } from './use-timeline-data';
import { useTimelineAnimation } from './use-timeline-animation';
import {
  useSlidingWindow,
  useEventStatistics,
  usePerformanceMonitor,
} from './use-sliding-window';
import './timeline.css';

// Create a query client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000,
      gcTime: 300000, // 5 minutes
    },
  },
});

// Performance Statistics Component
const PerformanceStats: React.FC = () => {
  const { data: stats } = useEventStatistics();
  const { data: performance } = usePerformanceMonitor();

  if (!stats) return null;

  return (
    <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div>Total: {stats.totalEvents}</div>
        <div>Visible: {stats.visibleEvents}</div>
        <div>Recent: {stats.recentEvents}</div>
        <div>Memory: ~{Math.round(stats.memoryUsage / 1024)}KB</div>
      </div>
      {performance?.memoryUsage && (
        <div className="mt-1 text-xs">
          JS Heap: {performance.memoryUsage.used}MB /{' '}
          {performance.memoryUsage.total}MB
        </div>
      )}
    </div>
  );
};

// Main Timeline Component with sliding window
const TimelineInner: React.FC = () => {
  // Initialize timeline data
  const { data: initialData, isLoading, error } = useTimelineInitialization();

  // Setup sliding window with automatic cleanup
  const {
    visibleEvents,
    windowBoundaries,
    forceCleanup,
    prefetchNextWindow,
    isCleaningUp,
  } = useSlidingWindow(200);

  // Start animation loop
  const { isRunning } = useTimelineAnimation({
    eventGenerationRate: 0.05,
    updateInterval: 50,
  });

  // Prefetch next window when scrolling fast
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        prefetchNextWindow();
      }, 5000); // Prefetch every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isRunning, prefetchNextWindow]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 space-x-2">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        <div className="text-muted-foreground">Loading timeline...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive bg-destructive/10 p-4 rounded border">
          Error loading timeline:{' '}
          {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xs font-semibold">Timeline</h1>
        <div className="flex items-center space-x-2 text-xs">
          <div
            className={`flex items-center space-x-1 ${
              isRunning ? 'text-green-600' : 'text-gray-500'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span>{isRunning ? 'Live' : 'Paused'}</span>
          </div>
        </div>
      </div>

      {/* Performance Statistics */}
      {/* <PerformanceStats /> */}

      {/* Controls */}
      <TimelineControls
        onForceCleanup={forceCleanup}
        windowBoundaries={windowBoundaries}
      />

      {/* Timeline Visualization */}
      <div className="relative">
        <TimelineVisualization
          height="22vh"
          windowSize={200}
          className="min-h-64"
          visibleEvents={visibleEvents}
        />

        {/* Window boundaries indicator */}
        <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/80 p-1 rounded">
          Window: {windowBoundaries.start.toFixed(1)} →{' '}
          {windowBoundaries.end.toFixed(1)}
        </div>
      </div>

      {/* Debug information in development */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">
            Debug Info
          </summary>
          <pre className="p-2 bg-muted rounded text-xs overflow-auto">
            {JSON.stringify(
              {
                visibleEventsCount: visibleEvents.length,
                windowBoundaries,
                isRunning,
                isCleaningUp,
              },
              null,
              2,
            )}
          </pre>
        </details>
      )}
    </div>
  );
};

// Main wrapper component with QueryClient provider
const TimelineComponent: React.FC = () => {
  return <TimelineInner />;
};

export default TimelineComponent;
