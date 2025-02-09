import React, { useCallback, useEffect, useRef, useState } from 'react';
import Timeline from 'react-calendar-timeline';
import 'react-calendar-timeline/style.css';
import moment from 'moment';
import { Button } from '@/components/ui/button';

// Styles personnalisés
const customStyles = `
  /* Style général de la timeline */
  .react-calendar-timeline .rct-outer {
    background-color: rgb(224, 224, 224); /* Light Gray 224 selon ISA 101 */
  }

  /* En-tête du calendrier */
  .react-calendar-timeline .rct-calendar-header {
    background-color: rgb(224, 224, 224); /* Light Gray 224 */
    border-bottom: 1px solid rgb(216, 216, 216); /* Light Gray 216 pour les séparateurs */
  }

  /* Style des groupes */
  .react-calendar-timeline .rct-sidebar {
    background-color: rgb(232, 232, 232); /* Light Gray 232 pour grouping box */
    color: rgb(63, 63, 63); /* Dark Gray 63 pour le texte */
    font-weight: 400;
    font-family: Arial, sans-serif;
    font-size: 10px;
  }

  /* Style des items */
  .react-calendar-timeline .rct-item {
    border-radius: 3px;
    box-shadow: 0 1px 3px rgba(12, 12, 12, 0.09);
    background-color: rgb(71, 92, 167); /* Blue standard ISA */
    color: rgb(255, 255, 255);
  }

  .react-calendar-timeline .rct-item.selected {
    background-color: rgb(71, 92, 167); /* Blue accent plus foncé */
    z-index: 999;
  }

  /* Couleurs par priorité pour les items selon ISA 101 */
  .group-item-1 { 
    background-color: rgb(226, 32, 40); /* Urgent Priority Alarm Red */
  }
  .group-item-2 { 
    background-color: rgb(236, 134, 41); /* High Priority Alarm Orange */
  }
  .group-item-3 { 
    background-color: rgb(245, 225, 27); /* Medium Priority Alarm Yellow */
    color: rgb(63, 63, 63); /* Dark text pour meilleure lisibilité sur fond jaune */
  }
  .group-item-4 { 
    background-color: rgb(145, 106, 173); /* Low Priority Alarm Magenta */
  }
  .group-item-5 { 
    background-color: rgb(71, 92, 167); /* Info Blue */
  }

  /* Style des lignes horizontales */
  .react-calendar-timeline .rct-horizontal-lines .rct-hl-even,
  .react-calendar-timeline .rct-horizontal-lines .rct-hl-odd {
    border-bottom: 1px solid rgb(216, 216, 216); /* Light Gray 216 pour les séparateurs */
  }

  /* Style des lignes verticales */
  .react-calendar-timeline .rct-vertical-lines .rct-vl {
    border-left: 1px solid rgb(216, 216, 216); /* Light Gray 216 pour les séparateurs */
  }

  /* Style du texte des éléments */
  .react-calendar-timeline .rct-item {
    font-family: Arial, sans-serif;
    font-size: 10px;
  }

  /* Poignées de redimensionnement */
  .react-calendar-timeline .rct-item .rct-item-handler {
    background-color: transparent;
    border: none;
    width: 6px;
  }
  
  .react-calendar-timeline .rct-item .rct-item-handler:hover {
    background-color: rgba(0, 0, 0, 0.1);
    cursor: ew-resize;
  }

  /* Playhead style */
  .timeline-playhead {
    position: absolute;
    top: 0;
    width: 2px;
    height: 100%;
    background-color: rgb(226, 32, 40);
    pointer-events: none;
    z-index: 1000;
  }

  /* Controls container */
  .timeline-controls {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    align-items: center;
  }

  .timeline-controls button {
    padding: 4px 8px;
    border: 1px solid rgb(160, 160, 164);
    background: rgb(224, 224, 224);
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
  }

  .timeline-controls button:hover {
    background: rgb(216, 216, 216);
  }

  .timeline-controls button.active {
    background: rgb(71, 92, 167);
    color: white;
  }

`;

interface IGroup {
  id: number;
  title: string;
}

interface IItem {
  id: number;
  group: number;
  title: string;
  start_time: moment.Moment;
  end_time: moment.Moment;
  canMove?: boolean;
  canResize?: boolean;
  className?: string;
}

interface AddGroupFormProps {
  onAddGroup: (title: string) => void;
}

const AddGroupForm: React.FC<AddGroupFormProps> = ({ onAddGroup }) => {
  const [groupTitle, setGroupTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupTitle.trim()) {
      onAddGroup(groupTitle);
      setGroupTitle('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
      <input
        type="text"
        value={groupTitle}
        onChange={(e) => setGroupTitle(e.target.value)}
        placeholder="Nom du groupe"
        className="p-2 border rounded"
      />
      <Button type="submit" className="px-4 py-2">
        Ajouter un groupe
      </Button>
    </form>
  );
};

const TimelineWithTracks: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(moment().valueOf());
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);

  const lastTimeRef = useRef(Date.now());

  const [items, setItems] = useState<IItem[]>([]);
  const [groups, setGroups] = useState<IGroup[]>([
    { id: 1, title: 'Groupe 1' },
  ]);
  const [nextGroupId, setNextGroupId] = useState(2);

  // Ajout des styles au DOM
  React.useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.innerText = customStyles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const handleAddGroup = (title: string) => {
    const newGroup: IGroup = {
      id: nextGroupId,
      title: title,
    };
    setGroups([...groups, newGroup]);
    setNextGroupId(nextGroupId + 1);
  };

  const handleRemoveGroup = (groupId: number) => {
    setGroups(groups.filter((group) => group.id !== groupId));
    setItems(items.filter((item) => item.group !== groupId));
  };

  const handleItemMove = (
    itemId: number,
    dragTime: number,
    newGroupOrder: number,
  ) => {
    const item = items.find((item) => item.id === itemId);
    if (!item) return;

    const roundTo5Seconds = (time: number) => {
      return Math.round(time / 5000) * 5000;
    };

    const newGroup = groups[newGroupOrder]?.id || item.group;
    const roundedDragTime = roundTo5Seconds(dragTime);
    const diff = moment(roundedDragTime).diff(item.start_time);

    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            start_time: moment(roundedDragTime),
            end_time: moment(item.end_time).add(diff, 'milliseconds'),
            group: newGroup,
          };
        }
        return item;
      }),
    );
  };

  const handleItemResize = (
    itemId: number,
    time: number,
    edge: 'left' | 'right',
  ) => {
    const roundTo5Seconds = (time: number) => {
      return Math.round(time / 5000) * 5000;
    };

    const roundedTime = roundTo5Seconds(time);

    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            start_time: edge === 'left' ? moment(roundedTime) : item.start_time,
            end_time: edge === 'right' ? moment(roundedTime) : item.end_time,
          };
        }
        return item;
      }),
    );
  };

  const handleCanvasClick = (groupId: number, time: number) => {
    const roundTo5Seconds = (time: number) => {
      return Math.round(time / 5000) * 5000;
    };

    const roundedTime = roundTo5Seconds(time);
    const newItem: IItem = {
      id: items.length + 1,
      group: groupId,
      title: `Nouvel item ${items.length + 1}`,
      start_time: moment(roundedTime),
      end_time: moment(roundedTime).add(15, 'seconds'),
      canMove: true,
      canResize: true,
      className: `group-item-${(items.length % 5) + 1}`,
    };

    setItems([...items, newItem]);
  };

  const timeSteps = {
    second: 5,
    minute: 1,
    hour: 1,
    day: 1,
    month: 1,
    year: 1,
  };

  const startPlayback = useCallback(() => {
    setIsPlaying(true);
    lastTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      setCurrentTime((prevTime) => prevTime + delta * playSpeed);
      const frameId = requestAnimationFrame(animate);
      setAnimationFrameId(frameId);
    };

    animate();
  }, [playSpeed]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
  }, [animationFrameId]);

  const resetPlayback = useCallback(() => {
    stopPlayback();
    setCurrentTime(moment().valueOf());
  }, [stopPlayback]);

  const changeSpeed = useCallback(
    (speed: number) => {
      setPlaySpeed(speed);
      if (isPlaying) {
        stopPlayback();
        startPlayback();
      }
    },
    [isPlaying, startPlayback, stopPlayback],
  );

  // Nettoyage de l'animation à la destruction du composant
  useEffect(() => {
    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [animationFrameId]);

  return (
    <div className="p-4">
      <AddGroupForm onAddGroup={handleAddGroup} />

      {/* Contrôles de lecture */}
      <div className="timeline-controls">
        <Button
          onClick={() => (isPlaying ? stopPlayback() : startPlayback())}
          className={isPlaying ? 'active' : ''}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </Button>

        <Button onClick={resetPlayback}>⏹️</Button>

        <div className="border-l h-6 mx-2 border-gray-300" />

        {[1, 2, 5, 10].map((speed) => (
          <Button
            key={speed}
            onClick={() => changeSpeed(speed)}
            className={playSpeed === speed ? 'active' : ''}
          >
            x{speed}
          </Button>
        ))}
      </div>

      <div className="mb-4">
        <h3 className="mb-2 font-bold">Groupes actuels:</h3>
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex items-center gap-2 p-2 bg-gray-100 rounded"
            >
              <span>{group.title}</span>
              <button
                onClick={() => handleRemoveGroup(group.id)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <Timeline<IItem, IGroup>
        groups={groups}
        items={items}
        defaultTimeStart={moment().add(-5, 'minutes').valueOf()}
        defaultTimeEnd={moment().add(5, 'minutes').valueOf()}
        canMove={true}
        canResize="both"
        onItemMove={handleItemMove}
        onItemResize={handleItemResize}
        onCanvasClick={handleCanvasClick}
        stackItems
        itemHeightRatio={0.75}
        timeSteps={timeSteps}
        minZoom={5 * 1000}
        maxZoom={60 * 60 * 1000}
        dragSnap={5 * 1000}
        lineHeight={60}
        // traditionalZoom={true}
        // visibleTimeStart={moment(currentTime).add(-5, 'minutes').valueOf()}
        // visibleTimeEnd={moment(currentTime).add(5, 'minutes').valueOf()}
        itemRenderer={({ item, itemContext, getItemProps }) => {
          return (
            <>
              <div
                className="timeline-playhead"
                style={{
                  left: `${50}%`, // La Timeline place le temps actuel au centre
                }}
              />
              <div
                {...getItemProps({
                  style: {
                    background: itemContext.selected ? '#228be6' : undefined,
                    borderColor: itemContext.selected ? '#1971c2' : undefined,
                  },
                })}
              >
                <div
                  style={{
                    height: '100%',
                    padding: '4px 8px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '14px',
                  }}
                >
                  {item.title}
                </div>
              </div>
            </>
          );
        }}
      />
    </div>
  );
};

export default TimelineWithTracks;
