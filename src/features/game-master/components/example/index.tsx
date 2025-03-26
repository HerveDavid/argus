import React from 'react';
import Browser from './browser';
import Controls from './controls';
import Timeline from './timeline';
import DisplayBar from './display-bar';
import StatusBar from './status-bar';

const SimulatorEditor: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Transport Controls - Responsive */}
      <div className="flex-shrink-0">
        <Controls />
      </div>

      {/* Main Content Area - Takes all available space */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar - Collapsible on small screens */}
        <div className="hidden md:block md:w-64 flex-shrink-0 bg-gray-200 border-r border-gray-300 overflow-hidden">
          <div className="h-full">
            <Browser />
          </div>
        </div>

        {/* Sequencer Area - Responsive */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Timeline - Takes all available space */}
          <div className="flex-1 min-h-0">
            <Timeline />
          </div>
        </div>
      </div>

      {/* Data bars - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-gray-300">
        {/* Display Bar - Responsive */}
        <DisplayBar />
        {/* Status Bar */}
        <StatusBar />
      </div>
    </div>
  );
};

export default SimulatorEditor;
