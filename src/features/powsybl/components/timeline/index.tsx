import React, { useEffect, useRef, useState } from 'react';
import { Timeline, DataSet } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';

// Define types for our events
interface EventData {
  message?: string;
  description?: string;
  modelName: string;
  time: string;
  type?: string;
}

// Define message template types
interface MessageTemplates {
  [key: string]: string[];
}

const TimelineComponent: React.FC = () => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstanceRef = useRef<Timeline | null>(null);
  const itemsRef = useRef<DataSet<any> | null>(null);
  const [playing, setPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1);
  const [lastEventTime, setLastEventTime] = useState<number>(0);
  // Initialize with a higher ID to avoid conflicts
  const [nextId, setNextId] = useState<number>(100); // Start with a safe number to avoid conflicts

  // Define our initial events
  const initialEvents: EventData[] = [
    {
      message: 'SWITCH : opening',
      modelName: 'MQIS P7_MQIS 7COUPL DJ_OC',
      time: '259.0000',
    },
    {
      description: 'overload 1200s side 2',
      modelName: 'MQIS Y761',
      time: '259.0000',
      type: 'END',
    },
    {
      description: 'permanent limit side 2',
      modelName: 'MQIS Y761',
      time: '259.0000',
      type: 'END',
    },
    {
      message: 'SVC Area : new level 0.05',
      modelName: 'RST_TRI_PP7',
      time: '260.0000',
    },
    {
      message: 'Voltage regulator : lower limit reached (UsRef)',
      modelName: 'DM_TRICAT 3',
      time: '278.0000',
    },
    {
      message: 'SVC Area : new level -0.2',
      modelName: 'RST_NEOULP6',
      time: '340.0000',
    },
    {
      message: 'SVC Area : new level 0.04',
      modelName: 'RST_TRI_PP7',
      time: '440.0000',
    },
    {
      message: 'SVC Area : new level -0.21',
      modelName: 'RST_NEOULP6',
      time: '480.0000',
    },
    {
      message: 'SVC Area : new level 0.03',
      modelName: 'RST_TRI_PP7',
      time: '620.0000',
    },
    {
      message: 'SVC Area : new level -0.22',
      modelName: 'RST_NEOULP6',
      time: '630.0000',
    },
    {
      message: 'SVC Area : new level -0.23',
      modelName: 'RST_NEOULP6',
      time: '770.0000',
    },
    {
      message: 'SVC Area : new level 0.02',
      modelName: 'RST_TRI_PP7',
      time: '810.0000',
    },
    {
      message: 'SVC Area : new level -0.24',
      modelName: 'RST_NEOULP6',
      time: '910.0000',
    },
    {
      message: 'SVC Area : new level 0.01',
      modelName: 'RST_TRI_PP7',
      time: '990.0000',
    },
  ];

  // Model message templates for generating new events
  const modelMessageTemplates: MessageTemplates = {
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

  // Status options for various models
  const statusOptions: string[] = [
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

  useEffect(() => {
    // Define colors for different models
    const colorMap: { [key: string]: string } = {
      RST_TRI_PP7: '#4CAF50', // Green
      'DM_TRICAT 3': '#2196F3', // Blue
      RST_NEOULP6: '#FF5722', // Orange
      'MQIS P7_MQIS 7COUPL DJ_OC': '#9C27B0', // Purple
      'MQIS Y761': '#F44336', // Red
    };

    // Create timeline items with colors
    const items = new DataSet();

    // Add initial events with sequential IDs
    initialEvents.forEach((event, index) => {
      const displayText = event.message || event.description || 'Unknown event';

      items.add({
        id: index + 1,
        content: `<div class="timeline-item" style="color: ${
          colorMap[event.modelName] || '#000'
        }">
                    ${displayText}
                  </div>`,
        start: parseFloat(event.time),
        type: 'box',
        title: `${displayText}<br>Time: ${event.time}<br>Model: ${
          event.modelName
        }${event.type ? '<br>Type: ' + event.type : ''}`,
        style: `background-color: ${colorMap[event.modelName] || '#ccc'}; 
                color: white; 
                border-radius: 4px; 
                padding: 2px 6px;`,
      });
    });

    itemsRef.current = items;

    // Find last event time
    const times = initialEvents.map((event) => parseFloat(event.time));
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    setLastEventTime(maxTime);

    // Calculate a good viewport window size - show about 200 units
    const windowSize = 200;

    // Timeline options - remove min/max to allow infinite scrolling
    const options = {
      height: '300px',
      showCurrentTime: false, // We'll use our own marker
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
      zoomMin: 60, // Minimum zoom window in ms
      format: {
        minorLabels: {
          millisecond: 'SSS',
          second: 's',
          minute: 'HH:mm',
          hour: 'HH:mm',
        },
      },
    };

    if (timelineRef.current) {
      // Initialize timeline
      const timeline = new Timeline(timelineRef.current, items, options);
      timelineInstanceRef.current = timeline;

      // Set initial visible window
      timeline.setWindow(minTime, minTime + windowSize);

      // Add custom time marker
      timeline.addCustomTime(minTime, 'current');
      timeline.setCustomTimeTitle('Current Time', 'current');
      setCurrentTime(minTime);
    }

    // Cleanup
    return () => {
      if (timelineInstanceRef.current) {
        timelineInstanceRef.current.destroy();
      }
    };
  }, []);

  // Helper function to generate a new event
  const generateNewEvent = (currentTime: number): EventData => {
    // Choose a random model
    const modelNames = Object.keys(modelMessageTemplates);
    const randomModel =
      modelNames[Math.floor(Math.random() * modelNames.length)];

    // Choose a random message template for this model
    const templates = modelMessageTemplates[randomModel];
    const randomTemplate =
      templates[Math.floor(Math.random() * templates.length)];

    let message: string;

    // For models that use status
    if (randomTemplate.includes('{status}')) {
      const randomStatus =
        statusOptions[Math.floor(Math.random() * statusOptions.length)];
      message = randomTemplate.replace('{status}', randomStatus);
    } else if (randomTemplate.includes('{value}')) {
      // For models using value
      const value = (Math.random() - 0.5).toFixed(2);
      message = randomTemplate.replace('{value}', value);
    } else {
      // For fixed messages
      message = randomTemplate;
    }

    // Decide if this is a message or description type event
    if (randomModel === 'MQIS Y761') {
      return {
        description: message,
        modelName: randomModel,
        time: currentTime.toFixed(4),
        type: Math.random() > 0.5 ? 'END' : 'INFO',
      };
    } else {
      return {
        message: message,
        modelName: randomModel,
        time: currentTime.toFixed(4),
      };
    }
  };

  // Function to add a new event to the timeline
  const addNewEvent = (event: EventData): void => {
    if (!itemsRef.current) return;

    const colorMap: { [key: string]: string } = {
      RST_TRI_PP7: '#4CAF50', // Green
      'DM_TRICAT 3': '#2196F3', // Blue
      RST_NEOULP6: '#FF5722', // Orange
      'MQIS P7_MQIS 7COUPL DJ_OC': '#9C27B0', // Purple
      'MQIS Y761': '#F44336', // Red
    };

    const displayText = event.message || event.description || 'Unknown event';

    itemsRef.current.add({
      id: nextId,
      content: `<div class="timeline-item" style="color: ${
        colorMap[event.modelName] || '#000'
      }">
                  ${displayText}
                </div>`,
      start: parseFloat(event.time),
      type: 'box',
      title: `${displayText}<br>Time: ${event.time}<br>Model: ${
        event.modelName
      }${event.type ? '<br>Type: ' + event.type : ''}`,
      style: `background-color: ${colorMap[event.modelName] || '#ccc'}; 
              color: white; 
              border-radius: 4px; 
              padding: 2px 6px;`,
    });

    setNextId((prevId) => prevId + 1);
    setLastEventTime(parseFloat(event.time));
  };

  // Effect for advancing the time marker and adding new events
  useEffect(() => {
    if (!playing) return;

    const interval = setInterval(() => {
      setCurrentTime((prevTime) => {
        const newTime = prevTime + speed;

        if (timelineInstanceRef.current) {
          // Update marker position
          timelineInstanceRef.current.setCustomTime(newTime, 'current');

          // Scroll timeline forward to follow the marker
          const window = timelineInstanceRef.current.getWindow();
          const windowSize = window.end - window.start;

          // Always keep the marker at 70% of the visible window
          timelineInstanceRef.current.setWindow(
            newTime - windowSize * 0.7,
            newTime + windowSize * 0.3,
          );

          // Randomly add new events as time progresses
          // Roughly 5% chance per second, adjusted for speed
          if (Math.random() < 0.05 * speed) {
            const newEvent = generateNewEvent(newTime);
            addNewEvent(newEvent);

            // Log for debugging
            console.log(`Added new event at time ${newTime} with ID ${nextId}`);
          }
        }

        return newTime;
      });
    }, 50); // Update very frequently for smoother animation

    return () => clearInterval(interval);
  }, [playing, speed, nextId]);

  return (
    <div className="">
      <h2 className="mb-4">Timeline</h2>
      <div
        className="bg-secondary border rounded mb-4 shadow-sm"
        ref={timelineRef}
      />
    </div>
  );
};

export default TimelineComponent;
