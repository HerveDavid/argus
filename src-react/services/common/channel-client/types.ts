import { Channel } from '@tauri-apps/api/core';
import * as Effect from 'effect/Effect';

import {
  ChannelNotFoundError,
  HandlerAlreadyExistsError,
  RegistrationError,
} from './errors';

export interface ChannelStatus {
  id: string;
  exists: boolean;
  paused: boolean | null;
}

export interface ChannelInfo {
  channelId: string;
  existsLocally: boolean;
  handlerCount: number;
  handlers: string[];
  backendStatus: ChannelStatus;
  isRunning: boolean;
  isPaused: boolean;
}

export interface ChannelService {
  readonly registerHandler: <T>(
    channelId: string,
    handlerId: string,
    handler: (data: T) => Effect.Effect<void>,
  ) => Effect.Effect<string, HandlerAlreadyExistsError | RegistrationError>;

  readonly unregisterHandler: (
    channelId: string,
    handlerId: string,
  ) => Effect.Effect<void>;

  readonly getChannel: <T>(
    channelId: string,
  ) => Effect.Effect<Channel<T>, ChannelNotFoundError>;

  readonly startChannel: (channelId: string) => Effect.Effect<void>;

  readonly pauseChannel: (channelId: string) => Effect.Effect<void>;

  readonly hasHandler: (
    channelId: string,
    handlerId: string,
  ) => Effect.Effect<boolean>;

  readonly getChannelIds: () => Effect.Effect<string[]>;

  readonly cleanup: () => Effect.Effect<void>;

  readonly stopChannel: (channelId: string) => Effect.Effect<void>;

  readonly getChannelStatus: (
    channelId: string,
  ) => Effect.Effect<ChannelStatus>;

  readonly listAllChannelStatuses: () => Effect.Effect<ChannelStatus[]>;

  readonly isChannelRunning: (channelId: string) => Effect.Effect<boolean>;

  readonly isChannelPaused: (channelId: string) => Effect.Effect<boolean>;

  readonly ensureChannelRunning: (channelId: string) => Effect.Effect<boolean>;

  readonly getChannelInfo: (channelId: string) => Effect.Effect<ChannelInfo>;
}

export interface ChannelData {
  channel: Channel<any>;
  handlers: Map<string, (data: any) => Effect.Effect<void>>;
  handlersArray: Array<(data: any) => Effect.Effect<void>>;
}
