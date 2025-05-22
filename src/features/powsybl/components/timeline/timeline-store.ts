// stores/timelineStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface EventData {
  id: number;
  message?: string;
  description?: string;
  modelName: string;
  time: number;
  type?: string;
  timestamp: number;
}

export interface TimelineState {
  // State
  startTimestamp: number;
  events: EventData[];
  currentTime: number;
  isPlaying: boolean;
  speed: number;
  nextId: number;
  lastEventTime: number;
  maxEventsToKeep: number;
  windowSize: number;

  // Performance tracking
  lastCleanupTime: number;
  cleanupThreshold: number;

  // Actions
  addEvent: (event: Omit<EventData, 'id' | 'timestamp'>) => void;
  addEvents: (events: Omit<EventData, 'id' | 'timestamp'>[]) => void;
  removeEvent: (id: number) => void;
  removeEventsBefore: (time: number) => void;
  setCurrentTime: (time: number) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: number) => void;
  setWindowSize: (size: number) => void;
  initializeEvents: (events: Omit<EventData, 'id' | 'timestamp'>[]) => void;
  cleanupOldEvents: () => void;
  getVisibleEvents: () => EventData[];
  reset: () => void;

  setStartTimestamp: (timestamp: number) => void; // Nouvelle action
  getAbsoluteTime: (relativeTime: number) => number; // Nouvelle fonction utilitaire
}

const INITIAL_STATE = {
  startTimestamp: Date.now(), // Initialiser avec l'heure actuelle
  events: [],
  currentTime: 0,
  isPlaying: true,
  speed: 1,
  nextId: 1,
  lastEventTime: 0,
  maxEventsToKeep: 1000, // Increased for better UX
  windowSize: 200,
  lastCleanupTime: 0,
  cleanupThreshold: 50, // Cleanup every 50 new events
};

export const useTimelineStore = create<TimelineState>()(
  subscribeWithSelector((set, get) => ({
    ...INITIAL_STATE,

    addEvent: (eventData) => {
      const state = get();
      const newEvent: EventData = {
        ...eventData,
        id: state.nextId,
        timestamp: Date.now(),
      };

      set((prevState) => {
        const newEvents = [...prevState.events, newEvent];

        // Auto-cleanup if threshold reached
        const shouldCleanup =
          newEvents.length - prevState.lastCleanupTime >
          prevState.cleanupThreshold;

        return {
          events: shouldCleanup
            ? newEvents.slice(-prevState.maxEventsToKeep)
            : newEvents,
          nextId: prevState.nextId + 1,
          lastEventTime: Math.max(prevState.lastEventTime, newEvent.time),
          lastCleanupTime: shouldCleanup
            ? newEvents.length
            : prevState.lastCleanupTime,
        };
      });
    },

    addEvents: (eventsData) => {
      const state = get();
      const startId = state.nextId;
      const newEvents = eventsData.map((eventData, index) => ({
        ...eventData,
        id: startId + index,
        timestamp: Date.now(),
      }));

      set((prevState) => ({
        events: [...prevState.events, ...newEvents],
        nextId: prevState.nextId + newEvents.length,
        lastEventTime: Math.max(
          prevState.lastEventTime,
          ...newEvents.map((e) => e.time),
        ),
      }));
    },

    removeEvent: (id) => {
      set((state) => ({
        events: state.events.filter((event) => event.id !== id),
      }));
    },

    removeEventsBefore: (time) => {
      set((state) => ({
        events: state.events.filter((event) => event.time >= time),
      }));
    },

    setCurrentTime: (time) => {
      set({ currentTime: time });

      // Auto-cleanup events that are too far behind
      const state = get();
      const cutoffTime = time - state.windowSize * 2; // Keep events 2 windows behind

      if (state.events.length > state.maxEventsToKeep) {
        state.removeEventsBefore(cutoffTime);
      }
    },

    setPlaying: (playing) => {
      set({ isPlaying: playing });
    },

    setSpeed: (speed) => {
      set({ speed: Math.max(0.1, Math.min(10, speed)) });
    },

    setWindowSize: (size) => {
      set({ windowSize: size });
    },

    initializeEvents: (eventsData) => {
      const events = eventsData.map((eventData, index) => ({
        ...eventData,
        id: index + 1,
        timestamp: Date.now(),
      }));

      const times = events.map((event) => event.time);
      const lastTime = times.length > 0 ? Math.max(...times) : 0;
      const minTime = times.length > 0 ? Math.min(...times) : 0;

      set({
        events,
        nextId: events.length + 1,
        lastEventTime: lastTime,
        currentTime: minTime,
        lastCleanupTime: 0,
      });
    },

    cleanupOldEvents: () => {
      set((state) => {
        // Remove events that are outside the current window and too old
        const cutoffTime = state.currentTime - state.windowSize * 3;
        const filteredEvents = state.events.filter(
          (event) =>
            event.time >= cutoffTime ||
            Math.abs(event.time - state.currentTime) <= state.windowSize,
        );

        // If still too many, keep only the most recent
        const finalEvents =
          filteredEvents.length > state.maxEventsToKeep
            ? filteredEvents.slice(-state.maxEventsToKeep)
            : filteredEvents;

        return {
          events: finalEvents,
          lastCleanupTime: finalEvents.length,
        };
      });
    },

    getVisibleEvents: () => {
      const state = get();
      const windowStart = state.currentTime - state.windowSize * 0.7;
      const windowEnd = state.currentTime + state.windowSize * 0.3;

      return state.events.filter(
        (event) => event.time >= windowStart && event.time <= windowEnd,
      );
    },

    reset: () => {
      set({
        ...INITIAL_STATE,
        events: [],
      });
    },

    setStartTimestamp: (timestamp) => {
      set({ startTimestamp: timestamp });
    },

    getAbsoluteTime: (relativeTime) => {
      const state = get();
      return state.startTimestamp + relativeTime;
    },

    initializeEvents: (eventsData) => {
      const events = eventsData.map((eventData, index) => ({
        ...eventData,
        id: index + 1,
        timestamp: Date.now(),
      }));

      const times = events.map((event) => event.time);
      const lastTime = times.length > 0 ? Math.max(...times) : 0;
      const minTime = times.length > 0 ? Math.min(...times) : 0;

      // Définir le timestamp de départ basé sur le premier événement
      const startTimestamp = Date.now() - minTime;

      set({
        events,
        nextId: events.length + 1,
        lastEventTime: lastTime,
        currentTime: minTime,
        lastCleanupTime: 0,
        startTimestamp, // Nouveau: définir le timestamp de départ
      });
    },
  })),
);

// Selector hooks for better performance
export const useTimelineEvents = () =>
  useTimelineStore((state) => state.events);
export const useTimelineCurrentTime = () =>
  useTimelineStore((state) => state.currentTime);
export const useTimelinePlayState = () =>
  useTimelineStore((state) => ({
    isPlaying: state.isPlaying,
    speed: state.speed,
  }));
export const useTimelineVisibleEvents = () =>
  useTimelineStore((state) => state.getVisibleEvents());
export const useTimelineActions = () =>
  useTimelineStore((state) => ({
    addEvent: state.addEvent,
    setCurrentTime: state.setCurrentTime,
    setPlaying: state.setPlaying,
    setSpeed: state.setSpeed,
    cleanupOldEvents: state.cleanupOldEvents,
    reset: state.reset,
  }));
