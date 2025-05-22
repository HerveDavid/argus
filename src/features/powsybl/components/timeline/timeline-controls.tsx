// components/TimelineControls.tsx
import React from 'react';
import { Play, Pause, RotateCcw, Trash2 } from 'lucide-react';
import { useTimelineStore } from './timeline-store';
import { Button } from '@/components/ui/button';

interface TimelineControlsProps {
  className?: string;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  className = '',
}) => {
  const {
    isPlaying,
    speed,
    currentTime,
    events,
    setPlaying,
    setSpeed,
    reset,
    cleanupOldEvents,
  } = useTimelineStore();

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
  };

  const speedOptions = [0.25, 0.5, 1, 2, 4, 8];

  return (
    <div
      className={`flex items-center gap-4 p-4 bg-card rounded-lg border ${className}`}
    >
      {/* Play/Pause Button */}
      <Button onClick={() => setPlaying(!isPlaying)}>
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        {isPlaying ? 'Pause' : 'Play'}
      </Button>

      {/* Speed Control */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Speed:</label>
        <select
          value={speed}
          onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
          className="px-2 py-1 border rounded text-sm bg-background"
        >
          {speedOptions.map((speedOption) => (
            <option key={speedOption} value={speedOption}>
              {speedOption}x
            </option>
          ))}
        </select>
      </div>

      {/* Current Time Display */}
      <div className="text-sm text-muted-foreground">
        Time: <span className="font-mono">{currentTime.toFixed(2)}</span>
      </div>

      {/* Event Count */}
      <div className="text-sm text-muted-foreground">
        Events: <span className="font-mono">{events.length}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 ml-auto">
        <Button onClick={cleanupOldEvents} title="Clean up old events">
          <Trash2 size={14} />
          Cleanup
        </Button>

        <Button onClick={reset} title="Reset timeline">
          <RotateCcw size={14} />
          Reset
        </Button>
      </div>
    </div>
  );
};

export default TimelineControls;
