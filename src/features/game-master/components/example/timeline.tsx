import React, { useState, useEffect } from 'react';
import TimelineComponent, {
  TimelineGroup,
  TimelineItem,
} from './timeline-component';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Timeline: React.FC = () => {
  // State for timeline data
  const [groups, setGroups] = useState<TimelineGroup[]>([]);
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [zoomLevel, setZoomLevel] = useState(0.5);

  // Initialize timeline data
  useEffect(() => {
    // Create flat groups structure instead of hierarchical
    const flatGroups: TimelineGroup[] = [
      { id: 1, content: 'Development - Project A' },
      { id: 2, content: 'Development - Project B' },
      { id: 3, content: 'Development - Project C' },
      { id: 4, content: 'Design - Project D' },
      { id: 5, content: 'Design - Project E' },
      { id: 6, content: 'Marketing - Project F' },
      { id: 7, content: 'Marketing - Project G' },
      { id: 8, content: 'Marketing - Project H' },
      { id: 9, content: 'Marketing - Project I' },
    ];

    setGroups(flatGroups);

    // Create items
    const timelineItems = createRandomItems(flatGroups);
    setItems(timelineItems);
  }, []);

  // Function to create random items
  const createRandomItems = (groups: TimelineGroup[]): TimelineItem[] => {
    const now = moment();
    const itemsArray: TimelineItem[] = [];
    let id = 1;

    // Create items for each group
    groups.forEach((group) => {
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
  };

  // Generate a unique ID for new groups
  const generateUniqueId = (): number => {
    // Find the highest existing ID and add 1
    const highestId = Math.max(...groups.map((group) => group.id), 0);
    return highestId + 1;
  };

  // Add a new group
  const addGroup = () => {
    const newId = generateUniqueId();
    const newGroup: TimelineGroup = {
      id: newId,
      content: `New Project ${newId}`,
    };

    setGroups([...groups, newGroup]);
  };

  // Handle changes to groups
  const handleGroupsChange = (updatedGroups: TimelineGroup[]) => {
    setGroups(updatedGroups);
  };

  // Handle changes to items
  const handleItemsChange = (updatedItems: TimelineItem[]) => {
    setItems(updatedItems);
  };

  return (
    <div className="h-full w-full flex flex-col">
      {/* Additional controls for groups management */}
      <div className="p-2 bg-gray-50 border-b flex justify-between items-center">
        <h3 className="text-sm font-medium">Timeline Projects</h3>
        <Button
          size="sm"
          onClick={addGroup}
          className="flex items-center gap-1"
        >
          <Plus size={16} />
          Add Project
        </Button>
      </div>

      {/* Timeline Component */}
      <div className="flex-grow">
        <TimelineComponent
          groups={groups}
          items={items}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
          onGroupsChange={handleGroupsChange}
          onItemsChange={handleItemsChange}
        />
      </div>
    </div>
  );
};

export default Timeline;
