import React from 'react';
import { useTheme } from '@/features/settings/theme/provider';

interface ThemeToggleProps {
  className?: string;
}
const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-md bg-surface-raised hover:bg-surface-hover ${className}`}
      aria-label={`Passer au mode ${theme === 'light' ? 'sombre' : 'clair'}`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};

const ProfileSettings = () => {
  return (
    <>
      <ThemeToggle />
    </>
  );
};

export default ProfileSettings;
