import { atom } from 'jotai';

import { Event } from '../../types/event';

// Settings
const MAX_EVENTS = 100;
const BATCH_SIZE = 50;
const MAX_BATCH_DELAY = 200;

// Buffers with re-allocation
let eventBuffer: Event[] = [];
let batchTimeoutId: number | null = null;
let isProcessing = false;
let lastFlushTime = 0;

// Atoms
export const eventsAtom = atom<Event[]>([]);

export const addEventAtom = atom(null, (get, set, newEvent: Event) => {
  eventBuffer.push(newEvent);

  const now = Date.now();
  const timeSinceLastFlush = now - lastFlushTime;

  const flushBuffer = () => {
    if (isProcessing || eventBuffer.length === 0) return;

    isProcessing = true;
    lastFlushTime = Date.now();

    const currentEvents = get(eventsAtom);
    const bufferLength = eventBuffer.length;

    let newEvents: Event[];

    if (currentEvents.length + bufferLength <= MAX_EVENTS) {
      newEvents = [...currentEvents, ...eventBuffer];
    } else {
      const totalNeeded = MAX_EVENTS;
      const fromBuffer = Math.min(bufferLength, totalNeeded);
      const fromCurrent = totalNeeded - fromBuffer;

      newEvents = [
        ...currentEvents.slice(-fromCurrent),
        ...eventBuffer.slice(-fromBuffer),
      ];
    }

    set(eventsAtom, newEvents);

    eventBuffer = [];
    batchTimeoutId = null;
    isProcessing = false;
  };

  const shouldFlushImmediately =
    eventBuffer.length >= BATCH_SIZE ||
    (eventBuffer.length >= 10 && timeSinceLastFlush > 500);

  if (shouldFlushImmediately) {
    if (batchTimeoutId !== null) {
      clearTimeout(batchTimeoutId);
    }

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(flushBuffer, { timeout: 50 });
    } else {
      setTimeout(flushBuffer, 0);
    }
    return;
  }

  if (eventBuffer.length === 1) {
    const adaptiveDelay =
      timeSinceLastFlush < 100 ? MAX_BATCH_DELAY * 2 : MAX_BATCH_DELAY;
    batchTimeoutId = setTimeout(
      flushBuffer,
      adaptiveDelay,
    ) as unknown as number;
  }
});
