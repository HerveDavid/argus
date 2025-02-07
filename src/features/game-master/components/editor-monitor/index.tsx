import { GridPreview } from './grid-preview';
import { TelecomPreview } from './telecom-preview';
import { TimelineControl } from './timeline-control';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import TimelineWithTracks from './timeline';

export const EditorMonitor = () => {
  return (
    <ResizablePanelGroup direction="vertical">
      {/* Video Preview Windows */}
      <ResizablePanel className="flex-1 flex">
        {/* Source Monitor */}
        <GridPreview></GridPreview>

        {/* Program Monitor */}
        <TelecomPreview></TelecomPreview>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Timeline Controls */}
      <ResizablePanel defaultSize={20}>
        <TimelineControl></TimelineControl>

        {/* Timeline */}
        <div className="flex-1 bg-gray-850 p-2 min-h-0">
          <TimelineWithTracks />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
