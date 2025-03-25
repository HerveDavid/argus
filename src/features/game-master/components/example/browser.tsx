import React, { useState } from 'react';

const Browser = () => {
  // State to track which categories are expanded
  const [expanded, setExpanded] = useState({
    collections: true,
    categories: true,
  });

  // Collections section data
  const collections = [
    { name: 'Favorites', color: 'red' },
    { name: 'Orange', color: 'orange' },
    { name: 'Yellow', color: 'yellow' },
    { name: 'Green', color: 'green' },
    { name: 'Blue', color: 'blue' },
    { name: 'Purple', color: 'purple' },
    { name: 'Gray', color: 'gray' },
  ];

  // Sounds section data - expandable items
  const sounds = [
    { name: 'Ambient & Evolving', expanded: false },
    { name: 'Bass', expanded: false },
    { name: 'Brass', expanded: false },
    { name: 'Effects', expanded: false },
    { name: 'Guitar & Plucked', expanded: false },
    { name: 'Mallets', expanded: false },
    { name: 'Pad', expanded: false },
    { name: 'Percussive', expanded: false },
    { name: 'Piano & Keys', expanded: false },
    { name: 'Strings', expanded: false },
    { name: 'Synth Keys', expanded: false },
    { name: 'Synth Lead', expanded: false },
    { name: 'Synth Misc', expanded: false },
    { name: 'Synth Rhythmic', expanded: false },
    { name: 'Vocals', expanded: false },
    { name: 'Winds', expanded: false },
  ];

  // Categories section data
  const categories = [
    { name: 'Sounds', icon: '🎵' },
    { name: 'Drums', icon: '🥁' },
    { name: 'Instruments', icon: '🎹' },
    { name: 'Audio Effects', icon: '🎛️' },
    { name: 'MIDI Effects', icon: '🎚️' },
    { name: 'Max for Live', icon: '🎯' },
    { name: 'Plugins', icon: '📂' },
    { name: 'Clips', icon: '💬' },
    { name: 'Samples', icon: '🔈' },
  ];

  // Places section data
  const places = [
    { name: 'Packs' },
    { name: 'User Library' },
    { name: 'Current Project' },
    { name: 'Add Folder...' },
  ];

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 text-xs w-full overflow-y-auto">
      {/* Search field */}
      <div className="p-1 flex items-center bg-gray-200 border-b border-gray-300">
        <span className="mr-1">🔍</span>
        <span>Search (Ctrl + F)</span>
      </div>

      {/* Collections section */}
      <div
        className="p-1 font-semibold bg-gray-300 hover:bg-gray-400 cursor-pointer flex items-center"
        onClick={() => toggleSection('collections')}
      >
        <span
          className={`mr-1 transform ${
            expanded.collections ? '' : '-rotate-90'
          } inline-block`}
        >
          ▼
        </span>
        Collections
      </div>

      {expanded.collections &&
        collections.map((item, index) => (
          <div
            key={index}
            className="pl-2 hover:bg-gray-200 p-1 flex items-center"
          >
            <span
              className={`w-2 h-2 mr-2 rounded-full bg-${item.color}-500`}
            ></span>
            <span>{item.name}</span>
          </div>
        ))}

      {/* Sounds section */}
      <div className="p-1 font-semibold bg-gray-300">Sounds</div>

      {sounds.map((item, index) => (
        <div
          key={index}
          className="pl-2 hover:bg-gray-200 p-1 flex items-center"
        >
          <span className="mr-1">▶</span>
          <span>{item.name}</span>
        </div>
      ))}

      {/* Categories section */}
      <div
        className="p-1 font-semibold bg-gray-300 hover:bg-gray-400 cursor-pointer flex items-center"
        onClick={() => toggleSection('categories')}
      >
        <span
          className={`mr-1 transform ${
            expanded.categories ? '' : '-rotate-90'
          } inline-block`}
        >
          ▼
        </span>
        Categories
      </div>

      {/* Places */}
      <div className="mt-auto">
        <div className="p-1 text-xs font-semibold bg-gray-300">Places</div>
        <div className="pl-2 text-xs hover:bg-gray-200 p-1">Packs</div>
        <div className="pl-2 text-xs hover:bg-gray-200 p-1">User Library</div>
        <div className="pl-2 text-xs hover:bg-gray-200 p-1">
          Current Project
        </div>
        <div className="pl-2 text-xs hover:bg-gray-200 p-1">Add Folder...</div>
      </div>
    </div>
  );
};

export default Browser;
