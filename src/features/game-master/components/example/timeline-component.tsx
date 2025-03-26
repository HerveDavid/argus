import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Timeline, DataSet, TimelineOptions } from 'vis-timeline/standalone';
import moment from 'moment';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { Button } from '@/components/ui/button';

// Define proper interfaces for our data structure
interface TimelineItem {
  id: number;
  group: number;
  content: string;
  start: Date;
  end: Date;
  className: string;
  title: string;
}

interface TimelineGroup {
  id: number;
  content: string;
  treeLevel: number;
  nestedGroups?: number[];
}

const TimelineComponent = () => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(0.5);
  const timelineInstanceRef = useRef<Timeline | null>(null);

  // Initialize the timeline
  useEffect(() => {
    if (!timelineRef.current) return;

    // Create the level 3 groups (most nested)
    const level3Groups: TimelineGroup[] = [
      { id: 1001, content: 'Project A', treeLevel: 3 },
      { id: 1002, content: 'Project B', treeLevel: 3 },
      { id: 1003, content: 'Project C', treeLevel: 3 },
      { id: 2001, content: 'Project D', treeLevel: 3 },
      { id: 2002, content: 'Project E', treeLevel: 3 },
      { id: 3001, content: 'Project F', treeLevel: 3 },
      { id: 3002, content: 'Project G', treeLevel: 3 },
      { id: 3003, content: 'Project H', treeLevel: 3 },
      { id: 3004, content: 'Project I', treeLevel: 3 },
    ];

    // Create the level 2 groups (departments)
    const level2Groups: TimelineGroup[] = [
      {
        id: 101,
        content: 'Development',
        treeLevel: 2,
        nestedGroups: [1001, 1002, 1003],
      },
      {
        id: 102,
        content: 'Design',
        treeLevel: 2,
        nestedGroups: [2001, 2002],
      },
      {
        id: 103,
        content: 'Marketing',
        treeLevel: 2,
        nestedGroups: [3001, 3002, 3003, 3004],
      },
      {
        id: 201,
        content: 'Development',
        treeLevel: 2,
      },
      {
        id: 202,
        content: 'Design',
        treeLevel: 2,
      },
      {
        id: 203,
        content: 'Marketing',
        treeLevel: 2,
      },
    ];

    // Create the level 1 groups (top level)
    const level1Groups: TimelineGroup[] = [
      {
        id: 10,
        content: 'Division A',
        treeLevel: 1,
        nestedGroups: [101, 102, 103],
      },
      {
        id: 20,
        content: 'Division B',
        treeLevel: 1,
        nestedGroups: [201, 202, 203],
      },
    ];

    // Combine all groups
    const allGroups = [...level1Groups, ...level2Groups, ...level3Groups];
    const groups = new DataSet<TimelineGroup>(allGroups);

    // Create items
    const now = moment();
    const items = new DataSet<TimelineItem>();

    // Function to create random items
    function createRandomItems(): TimelineItem[] {
      const itemsArray: TimelineItem[] = [];
      let id = 1;

      // Create items for level 3 groups
      level3Groups.forEach((group) => {
        // Create 2-4 items per project
        const itemCount = Math.floor(Math.random() * 3) + 2;

        for (let i = 0; i < itemCount; i++) {
          // Random start date within the last 30 days
          const randomStart = Math.floor(Math.random() * 30);
          const start = now.clone().subtract(randomStart, 'days');

          // Random duration between 1-7 days
          const duration = Math.floor(Math.random() * 7) + 1;
          const end = start.clone().add(duration, 'days');

          itemsArray.push({
            id: id++,
            group: group.id,
            content: `Task ${id}`,
            start: start.toDate(),
            end: end.toDate(),
            className: `project-${group.id % 10}`,
            title: `Task ${id} (${duration} days)`,
          });
        }
      });

      return itemsArray;
    }

    // Add items to the dataset
    items.add(createRandomItems());

    // Timeline options
    const options: TimelineOptions = {
      editable: true,
      margin: {
        item: 10,
        axis: 5,
      },
      orientation: 'both',
      zoomMax: 31536000000, // 1 year
      zoomMin: 86400000, // 1 day
      horizontalScroll: true,
      verticalScroll: true,
      zoomKey: 'ctrlKey',
      tooltip: {
        followMouse: true,
        overflowMethod: 'cap',
      },
      stack: true,
      stackSubgroups: true,
      showCurrentTime: true,
      showMajorLabels: true,
      showMinorLabels: true,
      autoResize: false, // Disable built-in resize and handle it manually
      height: '100%', // Use 100% of container height
    };

    // Create the timeline
    // Use type assertion to resolve compatibility issues with the library
    const timeline = new Timeline(
      timelineRef.current,
      items as any,
      groups as any,
      options,
    );

    // Store timeline instance in ref for later use
    timelineInstanceRef.current = timeline;

    // Initial fit after creation
    setTimeout(() => {
      if (timeline) {
        timeline.fit();
      }
    }, 200);

    // Clean up
    return () => {
      if (timeline) {
        timeline.destroy();
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Custom resize handler
  useEffect(() => {
    const handleResize = () => {
      if (timelineInstanceRef.current && timelineRef.current) {
        // First update parent element dimensions
        const parentElement = timelineRef.current.parentElement;
        if (parentElement) {
          const computedStyle = window.getComputedStyle(parentElement);
          timelineRef.current.style.width = computedStyle.width;
          timelineRef.current.style.height = computedStyle.height;
        }

        // Then force the timeline to redraw
        setTimeout(() => {
          if (timelineInstanceRef.current) {
            timelineInstanceRef.current.redraw();
          }
        }, 0);
      }
    };

    // Set up observer to detect changes in the parent container
    if (timelineRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });

      const parentElement = timelineRef.current.parentElement;
      if (parentElement) {
        resizeObserver.observe(parentElement);
      }

      // Also listen for window resize events
      window.addEventListener('resize', handleResize);

      // Call resize handler initially after a brief delay
      setTimeout(handleResize, 100);

      // Clean up
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  // Ensure we apply a resize when component mounts
  useLayoutEffect(() => {
    const initialResize = () => {
      if (timelineInstanceRef.current && timelineRef.current) {
        timelineInstanceRef.current.redraw();
      }
    };

    // Try multiple times to ensure it renders properly
    const t1 = setTimeout(initialResize, 100);
    const t2 = setTimeout(initialResize, 500);
    const t3 = setTimeout(initialResize, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Fonction pour réinitialiser le zoom et centrer sur aujourd'hui
  const resetView = () => {
    if (timelineInstanceRef.current) {
      timelineInstanceRef.current.fit();
      timelineInstanceRef.current.moveTo(moment().toDate());
      setZoomLevel(0.5);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Controls Header */}
      <div className="flex flex-row items-center justify-between p-2 bg-gray-100 rounded-t-md">
        <div className="font-bold">Project Timeline</div>
        <div className="flex space-x-2">
          <Button size="sm" onClick={resetView}>
            Reset View
          </Button>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="flex-grow relative" style={{ minHeight: 0 }}>
        <div ref={timelineRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default TimelineComponent;
