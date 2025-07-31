import { useCurrentMode, useIsTransitioning } from '@/hooks/use-mode';

export const Mode = () => {
  const currentMode = useCurrentMode();
  const isTransitioning = useIsTransitioning();

  const getModeDisplay = () => {
    return currentMode;
  };

  return (
    <div>
      <span className="text-xs text-muted-foreground">
        {getModeDisplay()}
        {isTransitioning && '...'}
      </span>
    </div>
  );
};
