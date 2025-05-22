// hooks/useSlidingWindow.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  useTimelineStore,
  useTimelineCurrentTime,
  useTimelineVisibleEvents,
} from './timeline-store';
import { useCallback, useMemo } from 'react';

// Hook for managing sliding window with automatic cleanup
export const useSlidingWindow = (windowSize: number = 200) => {
  const queryClient = useQueryClient();
  const currentTime = useTimelineCurrentTime();
  const { cleanupOldEvents, removeEventsBefore } = useTimelineStore();

  // Calculate window boundaries
  const windowBoundaries = useMemo(
    () => ({
      start: currentTime - windowSize * 0.7,
      end: currentTime + windowSize * 0.3,
      center: currentTime,
    }),
    [currentTime, windowSize],
  );

  // Query for visible events in the current window
  const visibleEventsQuery = useQuery({
    queryKey: ['visible-events', windowBoundaries.start, windowBoundaries.end],
    queryFn: async () => {
      const visibleEvents = useTimelineVisibleEvents();
      return visibleEvents.filter(
        (event) =>
          event.time >= windowBoundaries.start &&
          event.time <= windowBoundaries.end,
      );
    },
    staleTime: 50, // Very short stale time for real-time updates
    refetchInterval: 100, // Refetch every 100ms when focused
    enabled: true,
  });

  // Cleanup query for removing old events
  const cleanupQuery = useQuery({
    queryKey: ['cleanup-events', Math.floor(currentTime / windowSize)],
    queryFn: async () => {
      const cutoffTime = currentTime - windowSize * 3; // Keep 3 windows worth of history

      // Remove events that are too old
      removeEventsBefore(cutoffTime);

      // Invalidate visible events query
      await queryClient.invalidateQueries({ queryKey: ['visible-events'] });

      return { cleanedUpAt: Date.now(), cutoffTime };
    },
    enabled: true,
    staleTime: 5000, // Run cleanup every 5 seconds
    refetchInterval: 5000,
  });

  // Function to force cleanup
  const forceCleanup = useCallback(async () => {
    cleanupOldEvents();
    await queryClient.invalidateQueries({ queryKey: ['visible-events'] });
    await queryClient.invalidateQueries({ queryKey: ['cleanup-events'] });
  }, [cleanupOldEvents, queryClient]);

  // Function to prefetch next window
  const prefetchNextWindow = useCallback(async () => {
    const nextWindowStart = currentTime + windowSize * 0.3;
    const nextWindowEnd = currentTime + windowSize * 1.3;

    await queryClient.prefetchQuery({
      queryKey: ['visible-events', nextWindowStart, nextWindowEnd],
      queryFn: async () => {
        const visibleEvents = useTimelineVisibleEvents();
        return visibleEvents.filter(
          (event) =>
            event.time >= nextWindowStart && event.time <= nextWindowEnd,
        );
      },
      staleTime: 1000,
    });
  }, [currentTime, windowSize, queryClient]);

  return {
    visibleEvents: visibleEventsQuery.data || [],
    isLoading: visibleEventsQuery.isLoading,
    isError: visibleEventsQuery.isError,
    error: visibleEventsQuery.error,
    windowBoundaries,
    forceCleanup,
    prefetchNextWindow,
    cleanupInfo: cleanupQuery.data,
    isCleaningUp: cleanupQuery.isFetching,
  };
};

// Hook for event statistics and monitoring
export const useEventStatistics = () => {
  const { events, currentTime, windowSize } = useTimelineStore();

  return useQuery({
    queryKey: ['event-statistics', events.length, currentTime],
    queryFn: async () => {
      const now = Date.now();
      const recentEvents = events.filter(
        (event) => now - event.timestamp < 60000, // Events added in last minute
      );

      const visibleEvents = events.filter(
        (event) =>
          event.time >= currentTime - windowSize * 0.7 &&
          event.time <= currentTime + windowSize * 0.3,
      );

      const eventsByModel = events.reduce((acc, event) => {
        acc[event.modelName] = (acc[event.modelName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalEvents: events.length,
        recentEvents: recentEvents.length,
        visibleEvents: visibleEvents.length,
        eventsByModel,
        memoryUsage: events.length * 200, // Rough estimate in bytes
        oldestEvent:
          events.length > 0 ? Math.min(...events.map((e) => e.time)) : 0,
        newestEvent:
          events.length > 0 ? Math.max(...events.map((e) => e.time)) : 0,
      };
    },
    staleTime: 2000,
    refetchInterval: 2000,
  });
};

// Hook for performance monitoring
export const usePerformanceMonitor = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['performance-monitor'],
    queryFn: async () => {
      const cacheKeys = queryClient.getQueryCache().getAll().length;
      const memoryUsage = performance.memory
        ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
          }
        : null;

      return {
        cacheKeys,
        memoryUsage,
        timestamp: Date.now(),
      };
    },
    staleTime: 10000,
    refetchInterval: 10000,
  });
};
