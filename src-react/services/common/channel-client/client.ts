import { invoke, Channel } from '@tauri-apps/api/core';
import * as Effect from 'effect/Effect';
import * as Ref from 'effect/Ref';

import { ChannelNotFoundError, HandlerAlreadyExistsError } from './errors';
import { ChannelData, ChannelService, ChannelStatus } from './types';

export class ChannelClient extends Effect.Service<ChannelClient>()(
  '@/common/ChannelClient',
  {
    dependencies: [],
    effect: Effect.gen(function* () {
      const channelsRef = yield* Ref.make<Map<string, ChannelData>>(new Map());

      const cleanupChannel = (channelData: ChannelData) => {
        if (channelData.channel) {
          channelData.channel.onmessage = (_) => {};
        }
      };

      const updateHandlerCache = (channelData: ChannelData): void => {
        channelData.handlersArray = Array.from(channelData.handlers.values());
      };

      const createMessageHandler = (channelId: string) => (data: any) => {
        Effect.runFork(
          Effect.gen(function* () {
            const channels = yield* Ref.get(channelsRef);
            const channelData = channels.get(channelId);

            if (!channelData || channelData.handlersArray.length === 0) {
              return;
            }

            const handlersArray = channelData.handlersArray;
            const length = handlersArray.length;

            if (length === 1) {
              yield* handlersArray[0](data).pipe(
                Effect.catchAll((error) =>
                  Effect.logError(
                    `Handler in channel ${channelId} failed: ${error}`,
                  ),
                ),
              );
            } else {
              yield* Effect.forEach(
                handlersArray,
                (handler) =>
                  handler(data).pipe(
                    Effect.catchAll((error) =>
                      Effect.logError(
                        `Handler in channel ${channelId} failed: ${error}`,
                      ),
                    ),
                  ),
                { concurrency: 'unbounded', batching: true },
              );
            }
          }).pipe(
            Effect.catchAll((error) =>
              Effect.logError(
                `Message processing failed for channel ${channelId}: ${error}`,
              ),
            ),
          ),
        );
      };

      const ensureChannel = <T>(channelId: string) =>
        Effect.gen(function* () {
          const channels = yield* Ref.get(channelsRef);
          const existingChannelData = channels.get(channelId);

          if (existingChannelData) {
            return existingChannelData.channel as Channel<T>;
          }

          const newChannel = new Channel<T>();
          const channelData: ChannelData = {
            channel: newChannel as Channel<any>,
            handlers: new Map(),
            handlersArray: [],
          };

          newChannel.onmessage = createMessageHandler(channelId);

          yield* Ref.set(
            channelsRef,
            new Map(channels).set(channelId, channelData),
          );

          yield* Effect.logDebug(`Auto-created channel ${channelId}`);
          return newChannel;
        });

      const cleanupChannelIfEmpty = (channelId: string) =>
        Effect.gen(function* () {
          const channels = yield* Ref.get(channelsRef);
          const channelData = channels.get(channelId);

          if (!channelData || channelData.handlers.size > 0) {
            return;
          }

          cleanupChannel(channelData);

          yield* Effect.tryPromise({
            try: () => invoke('unregister', { id: channelId }),
            catch: (error) =>
              Effect.logError(
                `Backend cleanup failed for channel ${channelId}: ${error}`,
              ),
          });

          const newChannels = new Map(channels);
          newChannels.delete(channelId);
          yield* Ref.set(channelsRef, newChannels);

          yield* Effect.logDebug(`Auto-destroyed empty channel ${channelId}`);
        });

      return {
        registerHandler: <T>(
          channelId: string,
          handlerId: string,
          handler: (data: T) => Effect.Effect<void>,
        ) =>
          Effect.gen(function* () {
            const channels = yield* Ref.get(channelsRef);
            let channelData = channels.get(channelId);

            if (!channelData) {
              yield* ensureChannel<T>(channelId);
              const newChannels = yield* Ref.get(channelsRef);
              channelData = newChannels.get(channelId)!;
            }

            if (channelData.handlers.has(handlerId)) {
              yield* Effect.fail(
                new HandlerAlreadyExistsError(handlerId, channelId),
              );
            }

            const isFirstHandler = channelData.handlers.size === 0;

            if (isFirstHandler) {
              yield* Effect.tryPromise({
                try: () =>
                  invoke('register', {
                    id: channelId,
                    channel: channelData.channel,
                  }),
                catch: (error) =>
                  Effect.logError(
                    `Tauri registration failed for channel ${channelId}: ${error}`,
                  ),
              });

              // After registering, the backend automatically starts the channel
              // So we need to pause it to allow manual control
              yield* Effect.tryPromise({
                try: () => invoke('pause', { id: channelId }),
                catch: (error) =>
                  Effect.logDebug(
                    `Could not pause newly registered channel ${channelId}: ${error}`,
                  ),
              });
            }

            const newChannels = new Map(yield* Ref.get(channelsRef));
            const newChannelData = { ...newChannels.get(channelId)! };
            newChannelData.handlers = new Map(newChannelData.handlers);
            newChannelData.handlers.set(handlerId, handler as any);

            updateHandlerCache(newChannelData);

            newChannels.set(channelId, newChannelData);
            yield* Ref.set(channelsRef, newChannels);

            yield* Effect.logDebug(
              `Handler ${handlerId} registered for channel ${channelId} (total: ${newChannelData.handlersArray.length})`,
            );
            return handlerId;
          }),

        unregisterHandler: (channelId: string, handlerId: string) =>
          Effect.gen(function* () {
            const channels = yield* Ref.get(channelsRef);
            const channelData = channels.get(channelId);

            if (!channelData) {
              yield* Effect.logWarning(
                `Channel ${channelId} not found for handler unregistration`,
              );
              return;
            }

            if (!channelData.handlers.has(handlerId)) {
              yield* Effect.logWarning(
                `Handler ${handlerId} not found in channel ${channelId}`,
              );
              return;
            }

            const newChannels = new Map(channels);
            const newChannelData = { ...newChannels.get(channelId)! };
            newChannelData.handlers = new Map(newChannelData.handlers);
            newChannelData.handlers.delete(handlerId);

            updateHandlerCache(newChannelData);
            newChannels.set(channelId, newChannelData);
            yield* Ref.set(channelsRef, newChannels);

            yield* Effect.logDebug(
              `Handler ${handlerId} unregistered from channel ${channelId} (remaining: ${newChannelData.handlersArray.length})`,
            );

            yield* cleanupChannelIfEmpty(channelId);
          }),

        getChannel: <T>(channelId: string) =>
          Effect.gen(function* () {
            const channels = yield* Ref.get(channelsRef);
            const channelData = channels.get(channelId);

            if (!channelData) {
              return yield* Effect.fail(new ChannelNotFoundError(channelId));
            }

            return channelData.channel as Channel<T>;
          }),

        hasHandler: (channelId: string, handlerId: string) =>
          Effect.gen(function* () {
            const channels = yield* Ref.get(channelsRef);
            const channelData = channels.get(channelId);
            return channelData?.handlers.has(handlerId) ?? false;
          }),

        // Enhanced status management methods
        startChannel: (channelId: string) =>
          Effect.gen(function* () {
            yield* Effect.logDebug(`Starting channel ${channelId}`);
            return yield* Effect.tryPromise({
              try: () => invoke('start', { id: channelId }),
              catch: (error) =>
                new Error(`Failed to start channel ${channelId}: ${error}`),
            });
          }),

        stopChannel: (channelId: string) =>
          Effect.gen(function* () {
            yield* Effect.logDebug(`Stopping channel ${channelId}`);
            return yield* Effect.tryPromise({
              try: () => invoke('stop', { id: channelId }),
              catch: (error) =>
                new Error(`Failed to stop channel ${channelId}: ${error}`),
            });
          }),

        pauseChannel: (channelId: string) =>
          Effect.gen(function* () {
            yield* Effect.logDebug(`Pausing channel ${channelId}`);
            return yield* Effect.tryPromise({
              try: () => invoke('pause', { id: channelId }),
              catch: (error) =>
                new Error(`Failed to pause channel ${channelId}: ${error}`),
            });
          }),

        // New status checking methods
        getChannelStatus: (channelId: string) =>
          Effect.gen(function* () {
            yield* Effect.logDebug(`Getting status for channel ${channelId}`);
            return yield* Effect.tryPromise({
              try: () => invoke<ChannelStatus>('get_status', { id: channelId }),
              catch: (error) =>
                new Error(
                  `Failed to get status for channel ${channelId}: ${error}`,
                ),
            });
          }),

        listAllChannelStatuses: () =>
          Effect.gen(function* () {
            yield* Effect.logDebug('Listing all channel statuses');
            return yield* Effect.tryPromise({
              try: () => invoke<ChannelStatus[]>('list_channels'),
              catch: (error) =>
                new Error(`Failed to list channel statuses: ${error}`),
            });
          }),

        // Convenience method to check if channel is running
        isChannelRunning: (channelId: string) =>
          Effect.gen(function* () {
            const status = yield* Effect.tryPromise({
              try: () => invoke<ChannelStatus>('get_status', { id: channelId }),
              catch: (error) =>
                new Error(
                  `Failed to check if channel ${channelId} is running: ${error}`,
                ),
            });
            return status.exists && status.paused === false;
          }),

        // Convenience method to check if channel is paused
        isChannelPaused: (channelId: string) =>
          Effect.gen(function* () {
            const status = yield* Effect.tryPromise({
              try: () => invoke<ChannelStatus>('get_status', { id: channelId }),
              catch: (error) =>
                new Error(
                  `Failed to check if channel ${channelId} is paused: ${error}`,
                ),
            });
            return status.exists && status.paused === true;
          }),

        // Enhanced channel management with status awareness
        ensureChannelRunning: (channelId: string) =>
          Effect.gen(function* () {
            const status = yield* Effect.tryPromise({
              try: () => invoke<ChannelStatus>('get_status', { id: channelId }),
              catch: (error) =>
                new Error(
                  `Failed to check channel ${channelId} status: ${error}`,
                ),
            });

            if (!status.exists) {
              yield* Effect.logWarning(
                `Channel ${channelId} does not exist in backend`,
              );
              return false;
            }

            if (status.paused === true) {
              yield* Effect.logDebug(
                `Channel ${channelId} is paused, starting...`,
              );
              yield* Effect.tryPromise({
                try: () => invoke('start', { id: channelId }),
                catch: (error) =>
                  new Error(`Failed to start channel ${channelId}: ${error}`),
              });
              return true;
            }

            if (status.paused === false) {
              yield* Effect.logDebug(`Channel ${channelId} is already running`);
              return true;
            }

            return false;
          }),

        // Get comprehensive channel info (frontend + backend status)
        getChannelInfo: (channelId: string) =>
          Effect.gen(function* () {
            const channels = yield* Ref.get(channelsRef);
            const localChannelData = channels.get(channelId);

            const backendStatus = yield* Effect.tryPromise({
              try: () => invoke<ChannelStatus>('get_status', { id: channelId }),
              catch: (error) =>
                new Error(
                  `Failed to get backend status for channel ${channelId}: ${error}`,
                ),
            });

            return {
              channelId,
              existsLocally: !!localChannelData,
              handlerCount: localChannelData?.handlers.size ?? 0,
              handlers: localChannelData
                ? Array.from(localChannelData.handlers.keys())
                : [],
              backendStatus,
              isRunning: backendStatus.exists && backendStatus.paused === false,
              isPaused: backendStatus.exists && backendStatus.paused === true,
            };
          }),

        getChannelIds: () =>
          Effect.gen(function* () {
            const channels = yield* Ref.get(channelsRef);
            return Array.from(channels.keys());
          }),

        cleanup: () =>
          Effect.gen(function* () {
            const channels = yield* Ref.get(channelsRef);

            for (const [channelId, channelData] of channels.entries()) {
              cleanupChannel(channelData);
              yield* Effect.tryPromise({
                try: () => invoke('unregister', { id: channelId }),
                catch: Effect.logError,
              });
            }

            yield* Ref.set(channelsRef, new Map());
            yield* Effect.logDebug('All channels cleaned up');
          }),
      } as ChannelService;
    }),
  },
) {}
