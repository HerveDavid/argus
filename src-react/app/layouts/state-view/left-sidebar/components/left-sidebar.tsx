import { LeftIconPanels } from './left-icon-panels';
import { LeftIconTools } from './left-icon-tools';

export const LeftSidebar = () => {
  return (
    <div className="flex">
      <div className="w-8 border-r flex flex-col items-center py-2 relative justify-between">
        <LeftIconPanels />
        <LeftIconTools />
      </div>
    </div>
  );
};
