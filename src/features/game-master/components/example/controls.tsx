import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

const Controls = () => {
  const [currentTime, setCurrentTime] = useState<string>('0:00');
  const [tempo, setTempo] = useState<number>(120);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  return (
    <div className="bg-gray-300 p-1 flex flex-wrap items-center space-x-2 text-xs">
      <span>Tap</span>
      <div className="bg-black text-white px-2">{tempo}.00</div>
      <div className="flex items-center space-x-1">
        <span>1</span>
        <span>/</span>
        <span>4</span>
      </div>
      <span>♩</span>
      <span>=</span>
      <span>3 bar</span>
      <div className="flex-grow md:flex hidden"></div>
      <div className="flex space-x-1 my-1 sm:my-0 w-full sm:w-auto justify-center sm:justify-start">
        <Button variant="outline" size="icon" className="h-6 w-6 bg-gray-200">
          <SkipBack className="h-3 w-3" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-6 w-6 bg-gray-200"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>
        <Button variant="outline" size="icon" className="h-6 w-6 bg-gray-200">
          <SkipForward className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex-grow md:flex hidden"></div>
      <div className="hidden md:flex items-center space-x-1">
        <span>Key</span>
        <span>|</span>
        <span>MIDI</span>
        <span>|</span>
        <span>%</span>
        <span>|</span>
        <span>S</span>
      </div>
    </div>
  );
};

export default Controls;
