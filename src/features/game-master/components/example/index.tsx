import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import Browser from './browser';

// Types pour notre application
type CategoryItem = {
  name: string;
  color?: string;
  subcategories?: string[];
  isOpen?: boolean;
};

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

const SimulatorEditor: React.FC = () => {
  // État pour les catégories et les pistes
  const [categories, setCategories] = useState<CategoryItem[]>([
    { name: 'Favorites', color: 'red' },
    { name: 'Orange', color: 'orange' },
    { name: 'Yellow', color: 'yellow' },
    { name: 'Green', color: 'green' },
    { name: 'Blue', color: 'blue' },
    { name: 'Purple', color: 'purple' },
    { name: 'Gray', color: 'gray' },
  ]);

  const [soundCategories, setSoundCategories] = useState<CategoryItem[]>([
    {
      name: 'Ambient & Evolving',
      isOpen: true,
      subcategories: [],
    },
    {
      name: 'Bass',
      isOpen: false,
      subcategories: [],
    },
    {
      name: 'Brass',
      isOpen: false,
      subcategories: [],
    },
    {
      name: 'Effects',
      isOpen: false,
      subcategories: [],
    },
    {
      name: 'Guitar & Plucked',
      isOpen: false,
      subcategories: [],
    },
    {
      name: 'Mallets',
      isOpen: false,
      subcategories: [],
    },
    {
      name: 'Pad',
      isOpen: false,
      subcategories: [],
    },
    {
      name: 'Percussive',
      isOpen: false,
      subcategories: [],
    },
    {
      name: 'Piano & Keys',
      isOpen: false,
      subcategories: [],
    },
    {
      name: 'Strings',
      isOpen: false,
      subcategories: [],
    },
    {
      name: 'Synth Keys',
      isOpen: false,
      subcategories: [],
    },
    {
      name: 'Synth Lead',
      isOpen: false,
      subcategories: [],
    },
    {
      name: 'Synth Misc',
      isOpen: false,
      subcategories: [],
    },
    {
      name: 'Synth Rhythmic',
      isOpen: false,
      subcategories: [],
    },
    {
      name: 'Vocals',
      isOpen: false,
      subcategories: [],
    },
    {
      name: 'Winds',
      isOpen: false,
      subcategories: [],
    },
  ]);

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

  // État pour les contrôles de lecture
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('0:00');
  const [tempo, setTempo] = useState<number>(120);

  // Fonction de rendu des catégories
  const renderCategories = (
    cats: CategoryItem[],
    isSoundCategory: boolean = false,
  ) => {
    return cats.map((cat, index) => (
      <div
        key={index}
        className={`flex items-center p-1 hover:bg-gray-200 ${
          isSoundCategory ? 'pl-4' : 'pl-2'
        }`}
      >
        {cat.color && (
          <div className={`w-3 h-3 mr-2 bg-${cat.color}-500 rounded-sm`}></div>
        )}
        {isSoundCategory && cat.isOpen !== undefined && (
          <span className="mr-1">{cat.isOpen ? '▼' : '►'}</span>
        )}
        <span className="text-xs">{cat.name}</span>
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Transport Controls - Responsive */}
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

      {/* Main Content - Responsive */}
      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar - Collapsible on small screens */}
        <div className="hidden md:flex md:w-64 bg-gray-200 border-r border-gray-300 flex-col">
          {/* Search */}
          <div className="p-2 border-b border-gray-300">
            <input
              className="w-full px-2 py-1 text-xs bg-gray-100 border border-gray-300"
              placeholder="Search (Ctrl+F)"
            />
          </div>

          {/* Browser */}
          <Browser />
        </div>

        {/* Sequencer Area - Responsive */}
        <div className="flex-grow flex flex-col">
          {/* Timeline */}
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

          {/* Info Bar - Responsive */}
          <div className="h-24 bg-gray-200 border-t border-gray-400 flex flex-col md:flex-row">
            <div className="md:w-1/4 border-r border-gray-400 p-2">
              <div className="text-xs font-semibold">Track Display</div>
              <div className="text-xs text-gray-600 mt-1 hidden sm:block">
                Drag and drop to select time, then use any available Edit menu
                command to edit.
              </div>
              <div className="text-xs text-gray-600 mt-1 hidden md:block">
                <div>[Ctrl+Alt+Drag] Sound Display</div>
                <div>[Ctrl+] Sound Warp Zoom In/Out</div>
                <div>[Alt+Scroll Wheel] Adjust Track Height</div>
              </div>
            </div>
            <div className="flex-grow flex items-center justify-center text-xs text-gray-600">
              Drag Audio Effects Here
            </div>
            <div className="md:w-1/4 bg-gray-300 flex items-center justify-center relative">
              {/* Webcam placeholder */}
              <div className="bg-gray-700 w-full h-full">
                <div className="absolute bottom-0 right-0 p-1 bg-red-500 text-white text-xs">
                  @Sadowick
                </div>
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="h-6 bg-gray-300 border-t border-gray-400 flex items-center px-2 text-xs">
            <div className="flex-grow truncate">
              Insert Mark 1.1.1 (Time: 0:00)
            </div>
            <div className="ml-2 hidden sm:block">4-Audio</div>
          </div>
        </div>

        {/* Mixer Controls - Hidden on small screens, togglable */}
        <div className="hidden lg:flex lg:w-64 bg-gray-200 border-l border-gray-300 flex-col">
          {/* Master Volume */}
          <div className="p-2 flex flex-col">
            <div className="text-xs font-semibold">Master</div>
            <div className="mt-2 flex items-center">
              <Volume2 className="h-4 w-4 mr-2" />
              <Slider
                defaultValue={[80]}
                max={100}
                step={1}
                className="flex-grow"
              />
            </div>
            <div className="mt-2 flex items-center">
              <span className="text-xs mr-2">Pan</span>
              <Slider
                defaultValue={[50]}
                max={100}
                step={1}
                className="flex-grow"
              />
            </div>
          </div>

          {/* Effects */}
          <div className="flex-grow p-2">
            <div className="text-xs font-semibold mb-2">Effects</div>
            <div className="bg-gray-100 p-2 rounded mb-2 text-xs">
              <div className="flex items-center justify-between">
                <span>A-Reverb</span>
                <div className="flex items-center">
                  <button className="px-1 bg-yellow-500 border border-gray-400">
                    A
                  </button>
                  <button className="px-1 ml-1 bg-gray-300 border border-gray-400">
                    S
                  </button>
                </div>
              </div>
              <div className="mt-1">
                <Slider defaultValue={[60]} max={100} step={1} />
              </div>
            </div>
            <div className="bg-gray-100 p-2 rounded mb-2 text-xs">
              <div className="flex items-center justify-between">
                <span>B-Delay</span>
                <div className="flex items-center">
                  <button className="px-1 bg-yellow-500 border border-gray-400">
                    A
                  </button>
                  <button className="px-1 ml-1 bg-gray-300 border border-gray-400">
                    S
                  </button>
                </div>
              </div>
              <div className="mt-1">
                <Slider defaultValue={[40]} max={100} step={1} />
              </div>
            </div>
            <div className="bg-gray-100 p-2 rounded text-xs">
              <div className="flex items-center justify-between">
                <span>Master</span>
                <div className="flex items-center">
                  <button className="px-1 bg-yellow-500 border border-gray-400">
                    A
                  </button>
                  <button className="px-1 ml-1 bg-gray-300 border border-gray-400">
                    S
                  </button>
                </div>
              </div>
              <div className="mt-1">
                <Slider defaultValue={[80]} max={100} step={1} />
              </div>
            </div>
          </div>

          {/* Output Selector */}
          <div className="p-2 border-t border-gray-300">
            <div className="text-xs font-semibold">Output</div>
            <select className="w-full mt-1 text-xs p-1 bg-gray-100 border border-gray-300">
              <option>Main Output</option>
              <option>Headphones</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile controls - Only visible on small screens */}
      <div className="lg:hidden flex justify-between bg-gray-300 border-t border-gray-400 p-1 text-xs">
        <button className="bg-gray-200 px-2 py-1 border border-gray-400">
          📂 Browser
        </button>
        <button className="bg-gray-200 px-2 py-1 border border-gray-400">
          🔊 Mixer
        </button>
      </div>
    </div>
  );
};

export default SimulatorEditor;
