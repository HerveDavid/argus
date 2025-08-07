import { Channel } from '@tauri-apps/api/core';
import { Effect } from 'effect';
import { useCallback, useEffect, useState, useRef } from 'react';

import {
  ChannelClient,
  ChannelInfo,
  ChannelNotFoundError,
  ChannelStatus,
} from '@/services/common/channel-client';
import { useRuntime } from '@/services/runtime/use-runtime';

export interface ChannelProps<T> {
  channelId: string;
  handlerId?: string;
  handler?: (data: T) => void;
  autoConnect?: boolean;
  autoStart?: boolean; // New: automatically start channel when connected
  statusPollingInterval?: number; // New: poll status every N milliseconds
}

export const useChannel = <T>({
  channelId,
  handlerId,
  handler,
  autoConnect = false,
  autoStart = false,
  statusPollingInterval,
}: ChannelProps<T>) => {
  const runtime = useRuntime();
  const [channel, setChannelState] = useState<
    Channel<T> | ChannelNotFoundError
  >();
  const [isStarted, setIsStarted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // New status-related state
  const [status, setStatus] = useState<ChannelStatus | null>(null);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlerRef = useRef(handler);
  const statusPollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  // Enhanced sync channel with status updates
  const syncChannel = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const syncChannelEffect = Effect.gen(function* () {
      const channelClient = yield* ChannelClient;

      // Get channel and status concurrently
      const channelResult = yield* channelClient
        .getChannel<T>(channelId)
        .pipe(Effect.either);
      const statusResult = yield* channelClient
        .getChannelStatus(channelId)
        .pipe(Effect.either);
      const infoResult = yield* channelClient
        .getChannelInfo(channelId)
        .pipe(Effect.either);

      return {
        channel: channelResult,
        status: statusResult,
        info: infoResult,
      };
    });

    try {
      const result = await runtime.runPromise(syncChannelEffect);

      // Update channel state
      if (result.channel._tag === 'Right') {
        setChannelState(result.channel.right);
      } else {
        setChannelState(result.channel.left);
      }

      // Update status
      if (result.status._tag === 'Right') {
        setStatus(result.status.right);
        setIsStarted(
          result.status.right.exists && result.status.right.paused === false,
        );
      }

      // Update channel info
      if (result.info._tag === 'Right') {
        setChannelInfo(result.info.right);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [runtime, channelId]);

  // Start status polling
  const startStatusPolling = useCallback(() => {
    if (!statusPollingInterval || statusPollingRef.current) return;

    statusPollingRef.current = setInterval(() => {
      syncChannel();
    }, statusPollingInterval);
  }, [statusPollingInterval, syncChannel]);

  // Stop status polling
  const stopStatusPolling = useCallback(() => {
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
      statusPollingRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!handlerId || !handlerRef.current || isConnected) return;

    setIsLoading(true);
    setError(null);

    const handleEffect = (data: T) =>
      Effect.sync(() => handlerRef.current?.(data)).pipe(
        Effect.catchAll((error) =>
          Effect.logError(
            `Error in handler ${handlerId} for channel ${channelId}:`,
            error,
          ),
        ),
      );

    const registerEffect = Effect.gen(function* () {
      const channelClient = yield* ChannelClient;
      return yield* channelClient.registerHandler(
        channelId,
        handlerId,
        handleEffect,
      );
    });

    try {
      await runtime.runPromise(
        registerEffect.pipe(
          Effect.tap(() =>
            Effect.sync(() => {
              setIsConnected(true);
              startStatusPolling();
            }),
          ),
          Effect.tap(() =>
            Effect.log(
              `Connected to channel ${channelId} with handler ${handlerId}`,
            ),
          ),
        ),
      );

      await syncChannel();

      // Auto-start if enabled
      if (autoStart) {
        await start();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      await runtime.runPromise(
        Effect.logError(
          `Failed to register handler ${handlerId} for channel ${channelId}:`,
          err,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    channelId,
    handlerId,
    runtime,
    syncChannel,
    isConnected,
    autoStart,
    startStatusPolling,
  ]);

  const disconnect = useCallback(async () => {
    if (!handlerId || !isConnected) return;

    setIsLoading(true);
    setError(null);

    const unregisterEffect = Effect.gen(function* () {
      const channelClient = yield* ChannelClient;
      yield* channelClient.unregisterHandler(channelId, handlerId);
    });

    try {
      await runtime.runPromise(
        unregisterEffect.pipe(
          Effect.tap(() =>
            Effect.sync(() => {
              setIsConnected(false);
              stopStatusPolling();
            }),
          ),
          Effect.tap(() =>
            Effect.log(
              `Disconnected from channel ${channelId} handler ${handlerId}`,
            ),
          ),
        ),
      );

      await syncChannel();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to disconnect';
      setError(errorMessage);
      await runtime.runPromise(
        Effect.logError(
          `Failed to unregister handler ${handlerId} from channel ${channelId}:`,
          err,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    channelId,
    handlerId,
    runtime,
    syncChannel,
    isConnected,
    stopStatusPolling,
  ]);

  const start = useCallback(async () => {
    if (!channelId) return;

    setIsLoading(true);
    setError(null);

    const startEffect = Effect.gen(function* () {
      const channelClient = yield* ChannelClient;
      return yield* channelClient.startChannel(channelId);
    });

    try {
      await runtime.runPromise(
        startEffect.pipe(
          Effect.tap(() => Effect.sync(() => setIsStarted(true))),
          Effect.tap(() => Effect.log(`Started channel ${channelId}`)),
        ),
      );

      await syncChannel();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start';
      setError(errorMessage);
      await runtime.runPromise(
        Effect.logError(`Failed to start channel ${channelId}:`, err),
      );
    } finally {
      setIsLoading(false);
    }
  }, [channelId, runtime, syncChannel]);

  const pause = useCallback(async () => {
    if (!channelId) return;

    setIsLoading(true);
    setError(null);

    const pauseChannel = Effect.gen(function* () {
      const channelClient = yield* ChannelClient;
      return yield* channelClient.pauseChannel(channelId);
    });

    try {
      await runtime.runPromise(
        pauseChannel.pipe(
          Effect.tap(() => Effect.sync(() => setIsStarted(false))),
          Effect.tap(() => Effect.log(`Paused channel ${channelId}`)),
        ),
      );

      await syncChannel();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to pause';
      setError(errorMessage);
      await runtime.runPromise(
        Effect.logError(`Failed to pause channel ${channelId}:`, err),
      );
    } finally {
      setIsLoading(false);
    }
  }, [channelId, runtime, syncChannel]);

  // New: Stop channel completely
  const stop = useCallback(async () => {
    if (!channelId) return;

    setIsLoading(true);
    setError(null);

    const stopEffect = Effect.gen(function* () {
      const channelClient = yield* ChannelClient;
      return yield* channelClient.stopChannel(channelId);
    });

    try {
      await runtime.runPromise(
        stopEffect.pipe(
          Effect.tap(() => Effect.sync(() => setIsStarted(false))),
          Effect.tap(() => Effect.log(`Stopped channel ${channelId}`)),
        ),
      );

      await syncChannel();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to stop';
      setError(errorMessage);
      await runtime.runPromise(
        Effect.logError(`Failed to stop channel ${channelId}:`, err),
      );
    } finally {
      setIsLoading(false);
    }
  }, [channelId, runtime, syncChannel]);

  // New: Ensure channel is running
  const ensureRunning = useCallback(async () => {
    if (!channelId) return false;

    setIsLoading(true);
    setError(null);

    const ensureEffect = Effect.gen(function* () {
      const channelClient = yield* ChannelClient;
      return yield* channelClient.ensureChannelRunning(channelId);
    });

    try {
      const result = await runtime.runPromise(ensureEffect);
      await syncChannel();
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to ensure running';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [channelId, runtime, syncChannel]);

  // New: Refresh status manually
  const refreshStatus = useCallback(async () => {
    await syncChannel();
  }, [syncChannel]);

  // New: Check if channel is running
  const isRunning = useCallback(async (): Promise<boolean> => {
    const checkEffect = Effect.gen(function* () {
      const channelClient = yield* ChannelClient;
      return yield* channelClient.isChannelRunning(channelId);
    });

    try {
      return await runtime.runPromise(checkEffect);
    } catch {
      return false;
    }
  }, [channelId, runtime]);

  // New: Check if channel is paused
  const isPaused = useCallback(async (): Promise<boolean> => {
    const checkEffect = Effect.gen(function* () {
      const channelClient = yield* ChannelClient;
      return yield* channelClient.isChannelPaused(channelId);
    });

    try {
      return await runtime.runPromise(checkEffect);
    } catch {
      return false;
    }
  }, [channelId, runtime]);

  useEffect(() => {
    if (autoConnect && handlerId && handler && !isConnected) {
      connect();
    }

    return () => {
      stopStatusPolling();
      if (isConnected) {
        disconnect();
      }
    };
  }, [
    autoConnect,
    handlerId,
    handler,
    isConnected,
    connect,
    disconnect,
    stopStatusPolling,
  ]);

  // Initial sync on mount
  useEffect(() => {
    syncChannel();
  }, [syncChannel]);

  const getChannel = useCallback(async (): Promise<
    Channel<T> | ChannelNotFoundError
  > => {
    const effect = Effect.gen(function* () {
      const channelClient = yield* ChannelClient;
      return yield* channelClient.getChannel<T>(channelId);
    });
    const result = await runtime.runPromise(effect);
    setChannelState(result);
    return result;
  }, [runtime, channelId]);

  return {
    // Original properties
    channel,
    getChannel,
    channelId,
    isConnected,
    connect,
    disconnect,
    isStarted,
    start,
    pause,

    // New status management properties
    status,
    channelInfo,
    isLoading,
    error,
    stop,
    ensureRunning,
    refreshStatus,
    isRunning,
    isPaused,

    // Computed properties for convenience
    exists: status?.exists ?? false,
    backendPaused: status?.paused,
    handlerCount: channelInfo?.handlerCount ?? 0,
    handlers: channelInfo?.handlers ?? [],
  };
};
