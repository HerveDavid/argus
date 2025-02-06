import { GridPreview } from './grid-preview';
import { TelecomPreview } from './telecom-preview';
import { TimelinePanel } from './timeline-panel';
import { TimelineControl } from './timeline-control';

export const EditorMonitor = () => {

    return (
        <>
        {/* Video Preview Windows */}
        <div className="flex-1 flex">
          {/* Source Monitor */}
          <GridPreview></GridPreview>
          
          {/* Program Monitor */}
          <TelecomPreview></TelecomPreview>
        </div>

        {/* Timeline Controls */}
        <TimelineControl></TimelineControl>

        {/* Timeline */}
        <div className="flex-1 bg-gray-850 p-2 min-h-0">
          <TimelinePanel></TimelinePanel>         
        </div>
      </>
    )
}