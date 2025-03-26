import Browser from './browser';
import Controls from './controls';
import Timeline from './timeline';
import DisplayBar from './display-bar';
import StatusBar from './status-bar';

const SimulatorEditor = () => {
  return (
    <div className="flex flex-col h-full">
      {/* Transport Controls - Responsive */}
      <Controls />

      {/* Main Content - Responsive */}
      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar - Collapsible on small screens */}
        <div className="hidden md:flex md:w-64 bg-gray-200 border-r border-gray-300 flex-col">
          {/* Browser */}
          <Browser />
        </div>

        {/* Sequencer Area - Responsive */}
        <div className="flex-grow flex flex-col">
          {/* Timeline */}
          <Timeline />

          {/* Display Bar - Responsive */}
          <DisplayBar />

          {/* Status Bar */}
          <StatusBar />
        </div>
      </div>
    </div>
  );
};

export default SimulatorEditor;
