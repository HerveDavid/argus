import { setup, assign, fromPromise } from 'xstate';
import { SldMetadata } from '@/types/sld-metadata';
import { invoke } from '@tauri-apps/api/core';

export interface SldDiagramData {
  svg: string;
  metadata: SldMetadata;
}

export interface SldContext {
  lineId: string | null;
  diagramData: SldDiagramData | null;
  error: string | null;
  cache: Map<string, SldDiagramData>;
}

// Types pour les événements utilisateur
export type SldEvent =
  | { type: 'LOAD_DIAGRAM'; lineId: string }
  | { type: 'CLEAR_DIAGRAM' }
  | { type: 'CLEAR_CACHE' }
  | { type: 'RETRY' };

// Actor pour charger le diagramme depuis Tauri
const loadDiagramActor = fromPromise(
  async ({ input }: { input: { lineId: string } }) => {
    try {
      const result = await invoke<{ svg: string; metadata: SldMetadata }>(
        'get_single_line_diagram_with_metadata',
        { line_id: input.lineId },
      );
      return result;
    } catch (error) {
      throw new Error(`Erreur lors du chargement du diagramme: ${error}`);
    }
  },
);

// Configuration de la machine XState
export const sldMachine = setup({
  types: {
    context: {} as SldContext,
    events: {} as SldEvent,
  },
  actors: {
    loadDiagram: loadDiagramActor,
  },
  guards: {
    isDiagramCached: ({ context, event }) => {
      if (event.type !== 'LOAD_DIAGRAM') return false;
      return context.cache.has(event.lineId);
    },
    isSameDiagram: ({ context, event }) => {
      if (event.type !== 'LOAD_DIAGRAM') return false;
      return context.lineId === event.lineId;
    },
  },
  actions: {
    loadFromCache: assign(({ context, event }) => {
      if (event.type !== 'LOAD_DIAGRAM') return context;

      const cachedData = context.cache.get(event.lineId);
      return {
        ...context,
        lineId: event.lineId,
        diagramData: cachedData || null,
        error: null,
      };
    }),

    setLineId: assign(({ context, event }) => {
      if (event.type !== 'LOAD_DIAGRAM') return context;

      return {
        ...context,
        lineId: event.lineId,
        error: null,
      };
    }),

    clearDiagram: assign(({ context }) => ({
      ...context,
      lineId: null,
      diagramData: null,
      error: null,
    })),

    clearCache: assign(({ context }) => ({
      ...context,
      cache: new Map(),
    })),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwDYQCIEsCGUBO2AtgHSYQpgDEAMgPICC6A+ugJL0DiASvQLIDaABgC6iUAAcA9rEwAXTJIB2YkAA9EAVgDsATmIAOHYIBsgnQCYNAZnO2tAGhABPROa37igr14CMWwYY6VvoAviGOqBg4+ESk5FR0jCzs3Hz8PqJIIFIy8koq6gg6PhrEPmZWGtY6-j7mji4ItqWCVnU+OgAs1ubG+pZhEWhYuAQkZBQ0DMxsnDwC5pkS0nIKylmFxaXlQVVWNYJ1DYg2Pp5B-lpWnRd1gyCRIzHj8ZQAwtQAovRcTG-0bwAEp8hEtsis8utQIVjBpjAZzPpylpjF0aldjggfEjiBcND5gnVDAEtPdHtExsQUJJsBBMIooJQIEowKRFAA3SQAa1Z1NpTzGoJUOVW+Q2iBKOg8JnMnVq+g0QX0VkxGkOBkqwTa2i03R0ZOGFNifLpDMoYDweEkeGI4hQ2FkADNrSQTQKiEKsiLIQUJT5-cQ4bKFcZbEqNJjOnLcTpY8YrDYrFptFYDVFRsaaRBIFMkrNUgIRMKIWtfViLB5zNcE9p9FdyvpI1ozkqzEYtOZBIiUWn3a6sznEjMUvN0mDvaXxeXBKUq50E3LjJ0kcYfJik6U63D-X5FZZQuEHoaM-3aYPpsk5mlFsXcpPoRLFdLQ3LDgqlSrnJougYasTlcuCo+L2RqntmEDvF8PyXgWnrLHeYoPli-ilEGnShuYFjYkumI4jcsbJmqGjmD4xjJiBJ5UgOEEfN8vz-ECIJFl6JaIWorheNszYAWGJhwpibh6EibRVoJ-SYRRzzEBaVp4JQXCfAAKlwACacHgghULsU087ENWuoWKYiKYquZwiYuy4lD43SSZSMnWrmw5XoW46sVphSylYenzgZvRdo2X4IMmWgGAZ1idKRhKpoe5KUfZclDjBo4ZLeorua4un6TcfnGYFxirgYdToVUnZuAqtmxPFkF0UlaTMfBaVlp53lJtlRkBY0VhdrifQdoZGGdDOFUkFVtHQQxwLqRObGFJ05ieN4i1LWueX5cQc21B2Vj5fo85hIeiiSNm8BZLFzypT6U4ALSlLGd33Q9n6NFd8LeFW5RtjO1zmMNcQUBd97aaiXn4VKOhLgmnnrgm633YIupaMF5ExceUkmvSUAAzNEpdWZiLlJUCq6AEqo4r0srg+Dljbb9JqQFj6VNK0ehkdilQooi8PGKqbjrcEARIsiFikij6ZSfFDNlu4xCs-oSJdABqLc4FKIhcuOhEQSZXNvtIRAA */
  id: 'sldDiagram',
  initial: 'idle',
  context: {
    lineId: null,
    diagramData: null,
    error: null,
    cache: new Map(),
  },
  states: {
    idle: {
      on: {
        LOAD_DIAGRAM: [
          {
            guard: 'isSameDiagram',
            target: 'idle',
          },
          {
            guard: 'isDiagramCached',
            target: 'loaded',
            actions: 'loadFromCache',
          },
          {
            target: 'loading',
            actions: 'setLineId',
          },
        ],
        CLEAR_CACHE: {
          actions: 'clearCache',
        },
      },
    },
    loading: {
      invoke: {
        id: 'loadDiagram',
        src: 'loadDiagram',
        input: ({ context }) => ({ lineId: context.lineId! }),
        onDone: {
          target: 'loaded',
          actions: assign(({ context, event }) => {
            const diagramData = event.output;
            const newCache = new Map(context.cache);

            if (context.lineId) {
              newCache.set(context.lineId, diagramData);
            }

            return {
              ...context,
              diagramData,
              cache: newCache,
              error: null,
            };
          }),
        },
        onError: {
          target: 'error',
          actions: assign(({ context, event }) => ({
            ...context,
            diagramData: null,
            error: String(event.error) || 'Erreur inconnue',
          })),
        },
      },
    },
    loaded: {
      on: {
        LOAD_DIAGRAM: [
          {
            guard: 'isSameDiagram',
            target: 'loaded',
          },
          {
            guard: 'isDiagramCached',
            target: 'loaded',
            actions: 'loadFromCache',
          },
          {
            target: 'loading',
            actions: 'setLineId',
          },
        ],
        CLEAR_DIAGRAM: {
          target: 'idle',
          actions: 'clearDiagram',
        },
        CLEAR_CACHE: {
          actions: 'clearCache',
        },
      },
    },
    error: {
      on: {
        RETRY: {
          target: 'loading',
        },
        LOAD_DIAGRAM: [
          {
            guard: 'isDiagramCached',
            target: 'loaded',
            actions: 'loadFromCache',
          },
          {
            target: 'loading',
            actions: 'setLineId',
          },
        ],
        CLEAR_DIAGRAM: {
          target: 'idle',
          actions: 'clearDiagram',
        },
        CLEAR_CACHE: {
          actions: 'clearCache',
        },
      },
    },
  },
});
