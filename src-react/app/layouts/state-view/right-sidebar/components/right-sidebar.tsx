import { RightIconPanels } from './right-icon-panels';
import { RightIconTools } from './right-icon-tools';

export const RightSidebar = () => {
  return (
    <div className="flex">
      <div className="w-8 border-l flex flex-col items-center py-2 relative justify-between">
        <RightIconPanels />
        <RightIconTools />
      </div>
    </div>
  );
};
