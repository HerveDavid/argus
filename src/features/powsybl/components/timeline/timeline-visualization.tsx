// components/TimelineVisualization.tsx
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { Timeline, DataSet } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { useTimelineStore, EventData } from './timeline-store';

interface TimelineVisualizationProps {
  height?: string;
  windowSize?: number;
  className?: string;
}

const TimelineVisualization: React.FC<TimelineVisualizationProps> = ({
  height = '22vh',
  windowSize = 200,
  className = '',
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstanceRef = useRef<Timeline | null>(null);
  const itemsRef = useRef<DataSet<any> | null>(null);
  const customTimeInitializedRef = useRef<boolean>(false);

  const { events, currentTime, getAbsoluteTime } = useTimelineStore();

  // Color configuration
  const colorConfig = useMemo(
    () => ({
      description: {
        background: 'var(--background)',
        foreground: 'transparent',
      },
      message: {
        background: 'var(--background)',
        foreground: 'var(--highlight-foreground)',
      },
    }),
    [],
  );

  // Create timeline item from event data
  const createTimelineItem = useCallback(
    (event: EventData) => {
      const displayText = event.message || event.description || 'Unknown event';
      const colorKey = event.description ? 'description' : 'message';
      const colors = colorConfig[colorKey];

      // Convertir le temps relatif en timestamp absolu
      const { getAbsoluteTime } = useTimelineStore.getState();
      const absoluteTime = getAbsoluteTime(event.time);

      return {
        id: event.id,
        content: `<div class="timeline-item" style="color: ${colors.foreground}">
                  ${displayText}
                </div>`,
        start: absoluteTime,
        type: 'box' as const,
        title: `${displayText}<br>Time: ${new Date(
          absoluteTime,
        ).toLocaleTimeString()}<br>Model: ${event.modelName}${
          event.type ? '<br>Type: ' + event.type : ''
        }`,
        style: `background-color: ${colors.background}; 
              border-radius: 4px; 
              padding: 2px 6px;
              border: 1px solid ${colors.background};`,
      };
    },
    [colorConfig],
  );

  // Initialize timeline
  useEffect(() => {
    if (!timelineRef.current) return;

    const items = new DataSet();
    itemsRef.current = items;

    const options = {
      height,
      showCurrentTime: false,
      horizontalScroll: true,
      zoomable: true,
      moveable: true,
      orientation: { axis: 'bottom', item: 'top' },
      margin: { item: { vertical: 10, horizontal: 0 } },
      tooltip: {
        followMouse: true,
        overflowMethod: 'cap',
      },
      snap: null,
      // Zoom configuration pour avoir le zoom par défaut à la minute
      zoomMin: 1000, // 1 seconde minimum
      zoomMax: 1000 * 60 * 60 * 24, // 24 heures maximum
      // Définir le zoom initial (en millisecondes)
      // 60000 ms = 1 minute de largeur visible
      start: new Date(Date.now() - 30000), // 30 secondes avant maintenant
      end: new Date(Date.now() + 30000), // 30 secondes après maintenant
      format: {
        minorLabels: {
          millisecond: 'SSS',
          second: 's.SSS',
          minute: 'mm:ss',
          hour: 'HH:mm',
        },
        majorLabels: {
          millisecond: 's',
          second: 'mm:ss',
          minute: 'HH:mm',
          hour: 'DD/MM',
        },
      },
    };

    const timeline = new Timeline(timelineRef.current, items, options);
    timelineInstanceRef.current = timeline;

    // Reset custom time flag when timeline is recreated
    customTimeInitializedRef.current = false;

    return () => {
      if (timeline) {
        timeline.destroy();
      }
      timelineInstanceRef.current = null;
      itemsRef.current = null;
      customTimeInitializedRef.current = false;
    };
  }, [height, windowSize]);

  // Initialize custom time marker when we have events
  useEffect(() => {
    if (
      !timelineInstanceRef.current ||
      !events.length ||
      customTimeInitializedRef.current
    ) {
      return;
    }

    try {
      const { getAbsoluteTime } = useTimelineStore.getState();
      const minTime = Math.min(...events.map((e) => e.time));
      const absoluteMinTime = getAbsoluteTime(minTime);
      const absoluteCurrentTime = getAbsoluteTime(currentTime);

      timelineInstanceRef.current.addCustomTime(absoluteCurrentTime, 'current');
      timelineInstanceRef.current.setCustomTimeTitle('Current Time', 'current');

      // Définir la fenêtre initiale avec un zoom d'1 minute (60000 ms)
      const windowDuration = 60000; // 1 minute en millisecondes
      timelineInstanceRef.current.setWindow(
        absoluteCurrentTime - windowDuration / 2,
        absoluteCurrentTime + windowDuration / 2,
      );

      customTimeInitializedRef.current = true;
    } catch (error) {
      console.warn('Failed to initialize custom time:', error);
    }
  }, [events.length > 0, windowSize, currentTime]);

  // Update timeline items when events change
  useEffect(() => {
    if (!itemsRef.current) return;

    try {
      // Clear existing items
      itemsRef.current.clear();

      // Add all events
      const timelineItems = events.map(createTimelineItem);
      itemsRef.current.add(timelineItems);
    } catch (error) {
      console.warn('Failed to update timeline items:', error);
    }
  }, [events, createTimelineItem]);

  // Update current time marker and window
  useEffect(() => {
    if (!timelineInstanceRef.current || !customTimeInitializedRef.current) {
      return;
    }

    try {
      const { getAbsoluteTime } = useTimelineStore.getState();
      const absoluteCurrentTime = getAbsoluteTime(currentTime);

      // Update marker position
      timelineInstanceRef.current.setCustomTime(absoluteCurrentTime, 'current');

      // Update visible window to follow the marker
      const window = timelineInstanceRef.current.getWindow();
      const currentWindowSize = window.end - window.start;

      // Keep the marker at 70% of the visible window
      timelineInstanceRef.current.setWindow(
        absoluteCurrentTime - currentWindowSize * 0.7,
        absoluteCurrentTime + currentWindowSize * 0.3,
      );
    } catch (error) {
      console.warn('Failed to update current time:', error);
      customTimeInitializedRef.current = false;
    }
  }, [currentTime]);

  return (
    <div className={className}>
      <div
        className="bg-secondary border rounded shadow-sm"
        ref={timelineRef}
      />
    </div>
  );
};

export default TimelineVisualization;
