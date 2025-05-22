// components/TimelineControls.tsx
import React from 'react';
import { Play, Pause, RotateCcw, Trash2, Locate } from 'lucide-react';
import { useTimelineStore } from './timeline-store';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TimelineControlsProps {
  onForceCleanup?: () => void;
  windowBoundaries?: {
    start: number;
    end: number;
    center: number;
  };
  className?: string;
  onRecenterToCursor?: () => void;
}

const TimelineControls: React.FC<TimelineControlsProps> = ({
  onForceCleanup,
  windowBoundaries,
  className = '',
  onRecenterToCursor,
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

  const handleSpeedChange = (value: string) => {
    setSpeed(parseFloat(value));
  };

  const speedOptions = [0.25, 0.5, 1, 2, 4, 8];

  const handleCleanup = () => {
    if (onForceCleanup) {
      onForceCleanup();
    } else {
      cleanupOldEvents();
    }
  };

  return (
    <div
      className={`flex items-center gap-2 p-2 bg-card rounded-lg border ${className}`}
    >
      {/* Play/Pause Button */}
      <Button onClick={() => setPlaying(!isPlaying)} size="sm">
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        <span className="ml-2">{isPlaying ? 'Pause' : 'Play'}</span>
      </Button>

      {/* Speed Control */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Speed:</label>
        <Select value={speed.toString()} onValueChange={handleSpeedChange}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {speedOptions.map((speedOption) => (
              <SelectItem key={speedOption} value={speedOption.toString()}>
                {speedOption}x
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Button onClick={onRecenterToCursor} title="" variant="ghost">
          <Locate />
        </Button>
        <Button
          onClick={handleCleanup}
          title="Clean up old events"
          size="sm"
          variant="outline"
        >
          <Trash2 size={14} />
          <span className="ml-2">Cleanup</span>
        </Button>
        <Button
          onClick={reset}
          title="Reset timeline"
          size="sm"
          variant="outline"
        >
          <RotateCcw size={14} />
          <span className="ml-2">Reset</span>
        </Button>
      </div>
    </div>
  );
};

export default TimelineControls;
