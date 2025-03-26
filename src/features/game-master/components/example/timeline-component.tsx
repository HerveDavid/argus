import { useEffect, useRef, useLayoutEffect } from 'react';
import { Timeline, DataSet, TimelineOptions } from 'vis-timeline/standalone';
import moment from 'moment';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { Button } from '@/components/ui/button';

// Define proper interfaces for our data structure
export interface TimelineItem {
  id: number;
  group: number;
  content: string;
  start: Date;
  end: Date;
  className: string;
  title: string;
}

export interface TimelineGroup {
  id: number;
  content: string;
}

interface TimelineComponentProps {
  groups: TimelineGroup[];
  items: TimelineItem[];
  zoomLevel: number;
  onZoomChange: (level: number) => void;
  onGroupsChange?: (groups: TimelineGroup[]) => void;
  onItemsChange?: (items: TimelineItem[]) => void;
}

const TimelineComponent = ({
  groups,
  items,
  zoomLevel,
  onZoomChange,
  onGroupsChange,
  onItemsChange,
}: TimelineComponentProps) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstanceRef = useRef<Timeline | null>(null);

  // Initialize the timeline
  useEffect(() => {
    if (!timelineRef.current) return;

    // Convert arrays to DataSet objects for vis-timeline
    const groupsDataSet = new DataSet<TimelineGroup>(groups);
    const itemsDataSet = new DataSet<TimelineItem>(items);

    // Timeline options
    const options: TimelineOptions = {
      editable: true,
      margin: {
        item: 10,
        axis: 5,
      },
      orientation: 'top',
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
      showCurrentTime: true,
      showMajorLabels: true,
      showMinorLabels: true,
      autoResize: false, // Disable built-in resize and handle it manually
      height: '100%', // Use 100% of container height,
      // Ensure all items are range items (no point items)
      type: 'range',

      // Ajout du template pour l'alternance de couleurs
      template: function (item, element, data) {
        // Utilisez l'id de l'élément pour déterminer s'il est pair ou impair
        const isEven = item.id % 2 === 0;
        const backgroundColor = isEven ? '#f0f4f8' : '#e1ebf2';

        // Créez le HTML avec une couleur de fond alternative
        return `<div class="vis-item-content" style="background-color: ${backgroundColor};">
                  ${item.content}
                </div>`;
      },
    };

    // Create the timeline
    // Use type assertion to resolve compatibility issues with the library
    const timeline = new Timeline(
      timelineRef.current,
      itemsDataSet as any,
      groupsDataSet as any,
      options,
    );

    // Set up event listeners for changes
    if (onGroupsChange) {
      groupsDataSet.on('*', () => {
        onGroupsChange(groupsDataSet.get() as TimelineGroup[]);
      });
    }

    if (onItemsChange) {
      itemsDataSet.on('*', () => {
        onItemsChange(itemsDataSet.get() as TimelineItem[]);
      });
    }

    // Ensure items are always range items with duration when updated
    // Import TimelineEventPropertiesResult if needed
    let isUpdating = false;

    itemsDataSet.on('update', (event: { items: string[] }) => {
      // Éviter les mises à jour récursives
      if (isUpdating) return;

      isUpdating = true;

      // Traiter les éléments mis à jour
      event.items.forEach((itemId) => {
        const item = itemsDataSet.get(itemId);
        if (item && !item.end && item.start) {
          const startDate = new Date(item.start);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
          // Mettre à jour l'élément avec une date de fin
          itemsDataSet.update({
            id: item.id,
            end: endDate,
          });
        }
      });

      isUpdating = false;
    });

    // Store timeline instance in ref for later use
    timelineInstanceRef.current = timeline;

    // Initial fit after creation
    setTimeout(() => {
      if (timeline) {
        timeline.fit();
      }
    }, 200);

    // Ajout de styles CSS pour les éléments de la timeline
    const style = document.createElement('style');
    style.textContent = `
      .vis-item {
        border-color: #2d5986 !important;
      }
      .vis-item.vis-selected {
        background-color: #c2d8e9 !important;
        border-color: #1a365d !important;
      }
    `;
    document.head.appendChild(style);

    // Clean up
    return () => {
      if (timeline) {
        timeline.destroy();
      }
      document.head.removeChild(style);
    };
  }, [groups, items, onGroupsChange, onItemsChange]); // Re-initialize if groups or items change

  // Le reste du code reste inchangé
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

  // Function to reset view and center on today
  const resetView = () => {
    if (timelineInstanceRef.current) {
      timelineInstanceRef.current.fit();
      timelineInstanceRef.current.moveTo(moment().toDate());
      onZoomChange(0.5);
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
