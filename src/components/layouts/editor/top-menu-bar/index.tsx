import Clock from './clock';
import FileDropdown from './file-dropdown';
import ViewDropdown from './view-dropdown';

export const TopMenuBar = () => {
  return (
    <div className="flex items-center justify-between p-1 border-b shadow-sm z-10">
      <div className="flex space-x-4">
        <FileDropdown />
        <ViewDropdown />
      </div>
      <Clock />
    </div>
  );
};
