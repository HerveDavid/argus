import { ThemeToggle } from './theme-toggle';

export const Footer = () => {
  return (
    <div className="w-full p-1 h-5 border-t flex items-center shrink-0 justify-between">
      <div></div>
      <ThemeToggle />
    </div>
  );
};
