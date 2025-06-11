import { Sun, Moon } from 'lucide-react';
import React from 'react';

import { Switch } from '@/components/ui/switch';
import { useThemeStore } from '@/features/theme';

export const ThemeToggle: React.FC = () => {
  const { actualTheme, setTheme } = useThemeStore();

  const handleToggle = (checked: boolean): void => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <div className="flex items-center space-x-2">
      <Sun
        className={`size-3 ${actualTheme === 'light' ? 'text-foreground' : 'text-muted-foreground'}`}
      />
      <Switch
        id="theme-mode"
        checked={actualTheme === 'dark'}
        onCheckedChange={handleToggle}
        aria-label="Switch theme mode"
        className="scale-75"
      />
      <Moon
        className={`size-3 ${actualTheme === 'dark' ? 'text-foreground' : 'text-muted-foreground'}`}
      />
    </div>
  );
};
