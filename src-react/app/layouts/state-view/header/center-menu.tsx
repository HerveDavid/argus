import Clock from '@/features/clock';
import { Mode } from '@/features/mode';

export const CenterMenu = () => {
  return (
    <div className="flex items-center gap-x-4 text-sm">
      <Clock />
      <div className="bg-border h-6 w-px"></div>
      <Mode />
    </div>
  );
};
