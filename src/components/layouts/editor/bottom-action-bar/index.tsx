import { Signal } from 'lucide-react';

const BottomActionBar = () => {
  return (
    <div className="flex items-center justify-between p-1 border-t z-10">
      <div className="flex space-x-4 text-sm text-foreground"></div>
      <div className="flex items-center space-x-2 text-sm">
        <Signal size={16} className="text-green-500" />
      </div>
    </div>
  );
};

export default BottomActionBar;
