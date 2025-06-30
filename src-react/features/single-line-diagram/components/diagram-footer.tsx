import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock } from 'lucide-react';
import { useSldContext } from '../providers/sld.provider';
import { MetadataDisplay } from './metadata-display';

interface LastUpdateDisplayProps {
  lastUpdate: Date | null;
  currentTime: number;
}

const TIME_CONSTANTS = {
  UPDATE_INTERVAL: 1000, // 1 seconde
  SECONDS_IN_MINUTE: 60,
  SECONDS_IN_HOUR: 3600,
} as const;

const formatTimeSinceLastUpdate = (
  lastUpdate: Date | null,
  currentTime: number,
): string | null => {
  if (!lastUpdate) return null;

  const timeSinceUpdate = currentTime - lastUpdate.getTime();
  const seconds = Math.floor(timeSinceUpdate / 1000);

  if (seconds < TIME_CONSTANTS.SECONDS_IN_MINUTE) {
    return `${seconds}s ago`;
  }

  if (seconds < TIME_CONSTANTS.SECONDS_IN_HOUR) {
    const minutes = Math.floor(seconds / TIME_CONSTANTS.SECONDS_IN_MINUTE);
    return `${minutes}m ago`;
  }

  const hours = Math.floor(seconds / TIME_CONSTANTS.SECONDS_IN_HOUR);
  const remainingMinutes = Math.floor(
    (seconds % TIME_CONSTANTS.SECONDS_IN_HOUR) /
      TIME_CONSTANTS.SECONDS_IN_MINUTE,
  );
  return `${hours}h ${remainingMinutes}m ago`;
};

const useCurrentTime = () => {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, TIME_CONSTANTS.UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return currentTime;
};

const LastUpdateDisplay: React.FC<LastUpdateDisplayProps> = ({
  lastUpdate,
  currentTime,
}) => {
  const timeDisplay = useMemo(
    () => formatTimeSinceLastUpdate(lastUpdate, currentTime),
    [lastUpdate, currentTime],
  );

  if (!timeDisplay) return null;

  return (
    <>
      <Separator orientation="vertical" className="h-4" />
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{timeDisplay}</span>
      </div>
    </>
  );
};



const RefreshStatusCard: React.FC = () => {
  const {
    lastUpdate,
  } = useSldContext();

  const currentTime = useCurrentTime();


  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LastUpdateDisplay
              lastUpdate={lastUpdate}
              currentTime={currentTime}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MetadataSection: React.FC = () => {
  const { diagramData } = useSldContext();
  return <MetadataDisplay diagramData={diagramData} />;
};

export const DiagramFooter: React.FC = () => {
  const { isLoaded, isReady } = useSldContext();

  if (!isReady) {
    return null;
  }

  return (
    <footer
      className="flex justify-between items-center w-full h-5"
      role="contentinfo"
    >
      <MetadataSection />
      {isLoaded && <RefreshStatusCard />}
    </footer>
  );
};
