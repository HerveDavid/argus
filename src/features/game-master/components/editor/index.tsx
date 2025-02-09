import { CyberPhysicalList } from '../cyber-physical-list';
import { TelecomAssetList } from '../telecom-asset-list';
import { EditorMonitor } from '../editor-monitor';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

const Editor = () => {
  return (
    <ResizablePanelGroup direction="horizontal" className="flex flex-1">
      {/* Left Panel - Effects List */}
      <ResizablePanel
        minSize={2}
        className="w-64 bg-gray border-r border-gray-700"
      >
        <CyberPhysicalList></CyberPhysicalList>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Main Content */}
      <ResizablePanel defaultSize={75} className="flex flex-1 min-h-0 flex-col">
        <EditorMonitor />
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right Panel - Properties */}
      <ResizablePanel
        minSize={2}
        className="w-72 bg-gray-850 border-l border-gray-700"
      >
        <TelecomAssetList></TelecomAssetList>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Editor;
