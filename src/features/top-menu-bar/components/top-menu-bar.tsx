import FileDropdown from './file-dropdown';

export const TopMenuBar = () => {
  return (
    <div className="flex items-center justify-between p-1 bg-gray-800 border-b border-gray-700">
      <div className="flex space-x-4">
        <FileDropdown />
      </div>
    </div>
  );
};
