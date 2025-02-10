import FileDropdown from './file-dropdown';

export const TopMenuBar = () => {
  return (
    <div className="flex items-center justify-between p-1 border-b shadow">
      <div className="flex space-x-4">
        <FileDropdown />
      </div>
    </div>
  );
};
