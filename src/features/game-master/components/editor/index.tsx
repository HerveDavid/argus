import { TopMenuBar } from '../top-menu-bar';
import { CyberPhysicalList } from '../cyber-physical-list';
import { TelecomAssetList } from '../telecom-asset-list';
import { EditorMonitor } from '../editor-monitor';

const Editor = () => {
  
  return (
    <div className="flex flex-col fixed inset-0 bg-gray-900 text-gray-200 overflow-hidden">
      <TopMenuBar />

      <div className="flex flex-1">
        {/* Left Panel - Effects List */}
        <div className="w-64 bg-gray border-r border-gray-700">
          <CyberPhysicalList></CyberPhysicalList>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 min-h-0 flex-col">
          <EditorMonitor></EditorMonitor>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-72 bg-gray-850 border-l border-gray-700">
          <TelecomAssetList></TelecomAssetList>
        </div>
      </div>
    </div>
  );
};

export default Editor;