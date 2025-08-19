import { useEffect, useRef, useState } from 'react';
import { Effect, Runtime } from 'effect';
import { SldMetadata } from '@/types/sld-metadata';
import { ScadaMessage } from '@/types/tstm';
import { ScadaOutput } from '@/services/common/scada-client';
import { ScadaSubscriptionClient } from './scada-subscription';
import { runtime } from '@/config/runtime';

export interface UseScadaSubscriptionOptions {
  metadata?: SldMetadata;
  autoSubscribe?: boolean;
  maxMessages?: number;
}

export const useScadaSubscription = ({
  metadata,
  autoSubscribe = true,
  maxMessages = 1000,
}: UseScadaSubscriptionOptions) => {
  const [state, setState] = useState<{
    isSubscribed: boolean;
    isLoading: boolean;
    outputs: ScadaOutput[];
    messages: ScadaMessage[];
    error?: string;
  }>({
    isSubscribed: false,
    isLoading: false,
    outputs: [],
    messages: [],
  });

  const subscriptionRef = useRef<{
    unsubscribe: () => Effect.Effect<void, any>;
    pauseTask: (taskId: string) => Effect.Effect<void, any>;
    resumeTask: (taskId: string) => Effect.Effect<void, any>;
  } | null>(null);

  const messagesRef = useRef<ScadaMessage[]>([]);

  const subscribe = async () => {
    if (!metadata || state.isSubscribed) return;

    setState((prev) => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const scadaService = await Effect.runPromise(
        Effect.gen(function* () {
          return yield* ScadaSubscriptionClient;
        }).pipe(Runtime.runSync(runtime)),
      );

      const subscription = await Effect.runPromise(
        scadaService
          .createSubscription(metadata)
          .pipe(Runtime.runSync(runtime)),
      );

      subscriptionRef.current = subscription;

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
        outputs: subscription.outputs,
      }));

      // Écouter le stream de messages
      Effect.runFork(
        Effect.gen(function* () {
          yield* Effect.forEach(
            subscription.messageStream,
            (message) =>
              Effect.sync(() => {
                messagesRef.current = [
                  message,
                  ...messagesRef.current.slice(0, maxMessages - 1),
                ];
                setState((prev) => ({
                  ...prev,
                  messages: [...messagesRef.current],
                }));
              }),
            { concurrency: 1 },
          );
        }).pipe(Runtime.runSync(runtime)),
      );
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  };

  const unsubscribe = async () => {
    if (!subscriptionRef.current) return;

    try {
      await Effect.runPromise(
        subscriptionRef.current.unsubscribe().pipe(Runtime.runSync(runtime)),
      );

      subscriptionRef.current = null;
      messagesRef.current = [];

      setState({
        isSubscribed: false,
        isLoading: false,
        outputs: [],
        messages: [],
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  };

  const pauseTask = async (taskId: string) => {
    if (!subscriptionRef.current) return;

    try {
      await Effect.runPromise(
        subscriptionRef.current
          .pauseTask(taskId)
          .pipe(Runtime.runSync(runtime)),
      );
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  };

  const resumeTask = async (taskId: string) => {
    if (!subscriptionRef.current) return;

    try {
      await Effect.runPromise(
        subscriptionRef.current
          .resumeTask(taskId)
          .pipe(Runtime.runSync(runtime)),
      );
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  };

  const clearMessages = () => {
    messagesRef.current = [];
    setState((prev) => ({ ...prev, messages: [] }));
  };

  // Auto-subscribe quand les métadonnées arrivent
  useEffect(() => {
    if (autoSubscribe && metadata && !state.isSubscribed) {
      subscribe();
    }
  }, [metadata, autoSubscribe]);

  // Cleanup à la destruction
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        Effect.runSync(
          subscriptionRef.current.unsubscribe().pipe(Runtime.runSync(runtime)),
        );
      }
    };
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    pauseTask,
    resumeTask,
    clearMessages,
  };
};
