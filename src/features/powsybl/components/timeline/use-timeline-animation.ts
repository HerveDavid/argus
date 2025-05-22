// hooks/useTimelineAnimation.ts
import { useEffect, useRef } from 'react';
import { useTimelineStore } from './timeline-store';
import { useEventGenerator } from './use-timeline-data';

interface UseTimelineAnimationOptions {
  eventGenerationRate?: number; // Probability per second
  updateInterval?: number; // Update frequency in ms
}

export const useTimelineAnimation = (
  options: UseTimelineAnimationOptions = {},
) => {
  const {
    eventGenerationRate = 0.05, // 5% chance per second
    updateInterval = 50, // 50ms updates for smooth animation
  } = options;

  const { currentTime, isPlaying, speed, setCurrentTime, addEvent } =
    useTimelineStore();

  const { generateEvent } = useEventGenerator();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentTime(currentTime + speed);

      // Generate new events based on probability and speed
      if (Math.random() < eventGenerationRate * speed) {
        const newEvent = generateEvent(currentTime + speed);
        addEvent(newEvent);
      }
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    isPlaying,
    currentTime,
    speed,
    eventGenerationRate,
    updateInterval,
    setCurrentTime,
    addEvent,
    generateEvent,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isRunning: isPlaying && intervalRef.current !== null,
  };
};
