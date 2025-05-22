// hooks/useTimelineData.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTimelineStore } from './timeline-store';

// Event generation logic
interface MessageTemplates {
  [key: string]: string[];
}

const MODEL_MESSAGE_TEMPLATES: MessageTemplates = {
  RST_TRI_PP7: [
    'SVC Area : new level {value}',
    'Primary voltage adjusted to {value}',
    'Power level stabilized at {value}',
  ],
  'DM_TRICAT 3': [
    'Voltage regulator : {status}',
    'Control system : {status}',
    'Output stabilizer : {status}',
  ],
  RST_NEOULP6: [
    'SVC Area : new level {value}',
    'Secondary regulation : level {value}',
    'Voltage normalized to {value}',
  ],
  'MQIS P7_MQIS 7COUPL DJ_OC': [
    'SWITCH : opening',
    'SWITCH : closing',
    'Circuit protection : activated',
  ],
  'MQIS Y761': [
    'Overload protection : {status}',
    'Thermal limit : {status}',
    'System protection : {status}',
  ],
};

const STATUS_OPTIONS: string[] = [
  'lower limit reached (UsRef)',
  'upper limit reached (Q)',
  'normal operation resumed',
  'entering protection mode',
  'calibration required',
  'active',
  'inactive',
  'warning threshold',
  'normal range',
  'critical range',
];

// Initial events data
const INITIAL_EVENTS_DATA = [
  {
    message: 'SWITCH : opening',
    modelName: 'MQIS P7_MQIS 7COUPL DJ_OC',
    time: 259.0,
  },
  {
    description: 'overload 1200s side 2',
    modelName: 'MQIS Y761',
    time: 259.0,
    type: 'END',
  },
  {
    description: 'permanent limit side 2',
    modelName: 'MQIS Y761',
    time: 259.0,
    type: 'END',
  },
  {
    message: 'SVC Area : new level 0.05',
    modelName: 'RST_TRI_PP7',
    time: 260.0,
  },
  {
    message: 'Voltage regulator : lower limit reached (UsRef)',
    modelName: 'DM_TRICAT 3',
    time: 278.0,
  },
  {
    message: 'SVC Area : new level -0.2',
    modelName: 'RST_NEOULP6',
    time: 340.0,
  },
  {
    message: 'SVC Area : new level 0.04',
    modelName: 'RST_TRI_PP7',
    time: 440.0,
  },
  {
    message: 'SVC Area : new level -0.21',
    modelName: 'RST_NEOULP6',
    time: 480.0,
  },
  {
    message: 'SVC Area : new level 0.03',
    modelName: 'RST_TRI_PP7',
    time: 620.0,
  },
  {
    message: 'SVC Area : new level -0.22',
    modelName: 'RST_NEOULP6',
    time: 630.0,
  },
  {
    message: 'SVC Area : new level -0.23',
    modelName: 'RST_NEOULP6',
    time: 770.0,
  },
  {
    message: 'SVC Area : new level 0.02',
    modelName: 'RST_TRI_PP7',
    time: 810.0,
  },
  {
    message: 'SVC Area : new level -0.24',
    modelName: 'RST_NEOULP6',
    time: 910.0,
  },
  {
    message: 'SVC Area : new level 0.01',
    modelName: 'RST_TRI_PP7',
    time: 990.0,
  },
];

// Hook for generating new events
export const useEventGenerator = () => {
  const generateEvent = (currentTime: number) => {
    const modelNames = Object.keys(MODEL_MESSAGE_TEMPLATES);
    const randomModel =
      modelNames[Math.floor(Math.random() * modelNames.length)];

    const templates = MODEL_MESSAGE_TEMPLATES[randomModel];
    const randomTemplate =
      templates[Math.floor(Math.random() * templates.length)];

    let message: string;

    if (randomTemplate.includes('{status}')) {
      const randomStatus =
        STATUS_OPTIONS[Math.floor(Math.random() * STATUS_OPTIONS.length)];
      message = randomTemplate.replace('{status}', randomStatus);
    } else if (randomTemplate.includes('{value}')) {
      const value = (Math.random() - 0.5).toFixed(2);
      message = randomTemplate.replace('{value}', value);
    } else {
      message = randomTemplate;
    }

    if (randomModel === 'MQIS Y761') {
      return {
        description: message,
        modelName: randomModel,
        time: currentTime,
        type: Math.random() > 0.5 ? 'END' : 'INFO',
      };
    } else {
      return {
        message: message,
        modelName: randomModel,
        time: currentTime,
      };
    }
  };

  return { generateEvent };
};

// Hook for initializing timeline data
export const useTimelineInitialization = () => {
  const initializeEvents = useTimelineStore((state) => state.initializeEvents);

  return useQuery({
    queryKey: ['timeline-initialization'],
    queryFn: async () => {
      // Simulate async data loading (could be from API)
      await new Promise((resolve) => setTimeout(resolve, 100));
      return INITIAL_EVENTS_DATA;
    },
    staleTime: Infinity, // This data doesn't change
    onSuccess: (data) => {
      initializeEvents(data);
    },
  });
};

// Hook for managing event cleanup with TanStack Query
export const useEventCleanup = () => {
  const queryClient = useQueryClient();
  const { events, cleanupOldEvents, maxEventsToKeep } = useTimelineStore();

  return useQuery({
    queryKey: ['event-cleanup', events.length],
    queryFn: async () => {
      if (events.length > maxEventsToKeep) {
        cleanupOldEvents();
        // Invalidate related queries
        await queryClient.invalidateQueries({ queryKey: ['timeline-events'] });
      }
      return events.length;
    },
    enabled: events.length > maxEventsToKeep,
    staleTime: 5000, // Check every 5 seconds if needed
  });
};

// Hook for filtered events (sliding window)
export const useFilteredEvents = (windowSize: number = 200) => {
  const { events, currentTime } = useTimelineStore();

  return useQuery({
    queryKey: ['timeline-events', currentTime, windowSize],
    queryFn: async () => {
      // Filter events within the current time window
      const windowStart = currentTime - windowSize * 0.7;
      const windowEnd = currentTime + windowSize * 0.3;

      return events.filter(
        (event) => event.time >= windowStart && event.time <= windowEnd,
      );
    },
    staleTime: 100, // Very short stale time for real-time updates
    refetchInterval: 100, // Refetch every 100ms when component is focused
  });
};
