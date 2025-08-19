

// services/scada-subscription-service.ts
import { Channel, invoke } from '@tauri-apps/api/core';
import * as Effect from 'effect/Effect';
import * as Stream from 'effect/Stream';
import * as Queue from 'effect/Queue';
import * as Ref from 'effect/Ref';
import { SldMetadata } from '@/types/sld-metadata';
import { ScadaError, ScadaOutput } from '@/services/common/scada-client';
import { ScadaMessage } from '@/types/tstm';

export interface ScadaSubscriptionState {
  isSubscribed: boolean;
  outputs: ScadaOutput[];
  messages: ScadaMessage[];
  error?: string;
}

export interface ScadaSubscriptionActions {
  subscribe: () => void;
  unsubscribe: () => void;
  clearMessages: () => void;
  pauseTask: (taskId: string) => void;
  resumeTask: (taskId: string) => void;
}

export interface ScadaSubscriptionService {
  readonly createSubscription: (
    metadata: SldMetadata
  ) => Effect.Effect<{
    outputs: ScadaOutput[];
    messageStream: Stream.Stream<ScadaMessage, ScadaError>;
    unsubscribe: () => Effect.Effect<void, ScadaError>;
    pauseTask: (taskId: string) => Effect.Effect<void, ScadaError>;
    resumeTask: (taskId: string) => Effect.Effect<void, ScadaError>;
  }, ScadaError>;
}

export class ScadaSubscriptionClient extends Effect.Service<ScadaSubscriptionService>()(
  '@/scada/subscription',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      return {
        createSubscription: (metadata: SldMetadata) =>
          Effect.gen(function* () {
            // Créer un queue pour les messages
            const messageQueue = yield* Queue.unbounded<ScadaMessage>();
            
            // Créer le channel Tauri
            const channel = new Channel<ScadaMessage>();
            
            // Ref pour stocker les outputs et l'état de la subscription
            const outputsRef = yield* Ref.make<ScadaOutput[]>([]);
            const isActiveRef = yield* Ref.make(true);
            
            // Configuration du channel handler
            channel.onmessage = (message) => {
              Effect.runSync(
                Effect.gen(function* () {
                  const isActive = yield* Ref.get(isActiveRef);
                  if (isActive) {
                    yield* Queue.offer(messageQueue, message);
                  }
                })
              );
            };

            // Souscrire aux feeders SCADA
            const outputs = yield* Effect.tryPromise({
              try: () =>
                invoke<ScadaOutput[]>('subscribe_scada_feeders', {
                  metadata,
                  channel,
                }),
              catch: (error) =>
                new ScadaError({
                  message: error instanceof Error ? error.message : String(error),
                }),
            });

            // Stocker les outputs
            yield* Ref.set(outputsRef, outputs);

            // Créer le stream de messages
            const messageStream = Stream.fromQueue(messageQueue);

            // Fonction pour désouscrire
            const unsubscribe = () =>
              Effect.gen(function* () {
                yield* Ref.set(isActiveRef, false);
                
                // Fermer toutes les tâches
                for (const output of outputs) {
                  yield* Effect.tryPromise({
                    try: () =>
                      invoke<void>('close_task', { id: output.id }),
                    catch: (error) =>
                      new ScadaError({
                        message: error instanceof Error ? error.message : String(error),
                      }),
                  });
                }
                
                // Fermer la queue
                yield* Queue.shutdown(messageQueue);
              });

            // Fonctions pour pause/resume
            const pauseTask = (taskId: string) =>
              Effect.tryPromise({
                try: () =>
                  invoke<void>('pause_task', { id: taskId }),
                catch: (error) =>
                  new ScadaError({
                    message: error instanceof Error ? error.message : String(error),
                  }),
              });

            const resumeTask = (taskId: string) =>
              Effect.tryPromise({
                try: () =>
                  invoke<void>('resume_task', { id: taskId }),
                catch: (error) =>
                  new ScadaError({
                    message: error instanceof Error ? error.message : String(error),
                  }),
              });

            return {
              outputs,
              messageStream,
              unsubscribe,
              pauseTask,
              resumeTask,
            };
          }),
      } satisfies ScadaSubscriptionService;
    }),
  },
) {}