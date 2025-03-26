import { useState } from 'react';

type Track = {
  id: number;
  name: string;
  color: string;
  isMuted: boolean;
  isSolo: boolean;
  isArmed: boolean;
  volume: number;
  pan: number;
};

const Timeline = () => {
  const [tracks, setTracks] = useState<Track[]>([
    {
      id: 1,
      name: 'MIDI',
      color: 'yellow',
      isMuted: false,
      isSolo: false,
      isArmed: false,
      volume: 75,
      pan: 0,
    },
    {
      id: 2,
      name: 'MIDI',
      color: 'yellow',
      isMuted: false,
      isSolo: false,
      isArmed: false,
      volume: 75,
      pan: 0,
    },
    {
      id: 3,
      name: 'Audio',
      color: 'orange',
      isMuted: false,
      isSolo: false,
      isArmed: false,
      volume: 75,
      pan: 0,
    },
    {
      id: 4,
      name: 'Audio',
      color: 'orange',
      isMuted: false,
      isSolo: false,
      isArmed: false,
      volume: 75,
      pan: 0,
    },
  ]);

  return (
    <div className="flex-grow bg-gray-100 relative">
      <div className="absolute top-0 left-0 right-0 h-6 bg-gray-300 border-b border-gray-400 flex overflow-x-auto">
        {/* Bar numbers */}
        {Array.from({ length: 32 }).map((_, i) => (
          <div
            key={i}
            className="text-xs border-r border-gray-400 min-w-12 flex-1 flex justify-center items-center"
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Tracks grid */}
      <div className="absolute top-6 left-0 right-0 bottom-0 overflow-auto">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="h-24 border-b border-gray-300 relative"
          >
            <div
              className={`absolute left-0 top-0 bottom-0 right-0 bg-gray-200 flex`}
            >
              {/* Empty grid cells */}
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-12 border-r border-gray-300"
                ></div>
              ))}
            </div>

            {/* Track controls - Responsive */}
            <div
              className={`absolute right-0 top-0 bottom-0 md:w-64 w-32 bg-${track.color}-200 border-l border-gray-400 p-2`}
            >
              <div className="flex items-center justify-between text-xs">
                <div>
                  {index + 1} {track.name}
                </div>
                <div className="flex space-x-1">
                  <button className="px-1 bg-gray-100 border border-gray-400">
                    In
                  </button>
                  <button className="px-1 bg-gray-100 border border-gray-400">
                    Out
                  </button>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <button
                  className={`px-1 ${
                    track.isMuted ? 'bg-red-500' : 'bg-gray-300'
                  } border border-gray-400`}
                >
                  M
                </button>
                <button
                  className={`px-1 ${
                    track.isSolo ? 'bg-yellow-500' : 'bg-gray-300'
                  } border border-gray-400`}
                >
                  S
                </button>
                <button
                  className={`px-1 ${
                    track.isArmed ? 'bg-red-500' : 'bg-gray-300'
                  } border border-gray-400`}
                >
                  R
                </button>
                <div className="flex-grow"></div>
                <span className="text-xs hidden sm:inline">Master</span>
              </div>
            </div>
          </div>
        ))}

        {/* Message when empty */}
        <div className="absolute left-0 right-0 top-1/2 text-center text-gray-500 text-sm">
          Drag Files and Devices Here
        </div>
      </div>
    </div>
  );
};

export default Timeline;
