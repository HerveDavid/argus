import Clock from '@/features/clock';

import { ThemeToggle } from './theme-toggle';

export const Footer = () => {
  return (
    <div className="w-full p-1 h-5 border-t flex items-center shrink-0 justify-between">
      <Clock />
      <ThemeToggle />
    </div>
  );
};
