import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useMemo, memo } from 'react';
import UplotReact from 'uplot-react';

import { Button } from '@/components/ui/button';
import { channels } from '@/config/channels';
import { useChannel } from '@/hooks/use-channel';

import { Event } from '../../types/event';

import { addEventAtom, eventsAtom } from './primitive';

import 'uplot/dist/uPlot.min.css';

const HANDLER_ID = 'chart-handler';

const MemoizedChart = memo(({ options, data }: { options: any; data: any }) => (
  <UplotReact options={options} data={data} />
));

const options = {
  width: 800,
  height: 400,
  scales: {
    x: { time: true },
    y: {
      range: (_u: any, dataMin: number, dataMax: number) => {
        if (dataMin === dataMax) {
          return [dataMin - 1, dataMax + 1];
        }
        return [dataMin * 0.9, dataMax * 1.1];
      },
    },
  },
  axes: [
    {
      label: 'Time',
      values: (_u: any, vals: number[]) =>
        vals.map((v) =>
          new Date(v * 1000).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        ),
      space: 80,
      size: 50,
    },
    {
      label: 'Value',
      size: 60,
      space: 40,
    },
  ],
  series: [
    { label: 'Time' },
    {
      label: 'Value',
      stroke: 'oklch(0.6180 0.0778 65.5444)',
      width: 2,
      points: { show: false },
    },
  ],
  cursor: {
    show: true,
    x: true,
    y: true,
  },
};

export default function ChartComponent() {
  const events = useAtomValue(eventsAtom);
  const addEvent = useSetAtom(addEventAtom);

  const handleEvent = useCallback(
    (event: Event) => {
      addEvent(event);
    },
    [addEvent],
  );

  const { start, pause, connect, disconnect, isStarted } = useChannel<Event>({
    channelId: channels.log.events,
    handlerId: HANDLER_ID,
    handler: handleEvent,
    autoConnect: false,
  });

  const plotData = useMemo(() => {
    if (!events.length) return [[], []];

    const len = events.length;
    const timestamps = new Array(len);
    const values = new Array(len);

    for (let i = 0; i < len; i++) {
      timestamps[i] = new Date(events[i].timestamp).getTime() / 1000;
      values[i] = events[i].value;
    }

    return [timestamps, values];
  }, [events]);

  const startClick = useCallback(async () => {
    await connect();
    await start();
  }, [connect, start]);

  const stopClick = useCallback(async () => {
    await pause();
    await disconnect();
  }, [pause, disconnect]);

  return (
    <div>
      <div className="space-x-2 flex items-center p-2 border-b">
        <Button onClick={startClick} disabled={isStarted}>
          Start
        </Button>
        <Button onClick={stopClick} variant="secondary" disabled={!isStarted}>
          Stop
        </Button>
        <p>{isStarted ? '🔴 Live' : '🟢 Standby'}</p>
        <span className="text-sm text-muted-foreground ml-4">
          {events.length} events
        </span>
      </div>

      <div className="p-4">
        <div className="w-full">
          {events.length > 0 ? (
            <MemoizedChart options={options} data={plotData} />
          ) : (
            <div className="flex items-center justify-center h-96 border border-dashed border-muted-foreground/25 rounded-lg text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">No data available</p>
                <p className="text-sm">Start streaming to see real-time data</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
