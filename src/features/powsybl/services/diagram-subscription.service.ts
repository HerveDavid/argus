import { Channel, invoke } from '@tauri-apps/api/core';
import { Effect } from 'effect';
import { TelemetryCurves } from '../types/telemetry-curves.type';
import { SldMetadata } from '../types/sld-metatada.type';

interface SldSubscriptionResponse {
  readonly _tag: 'SldSubscriptionStatus';
  readonly status: 'connected' | 'disconnected';
}

class SubscriptionSLDError extends Error {
  readonly _tag = 'SubscriptionSLDError';

  constructor(error: any) {
    super(error);
  }
}

let ACTIVE_CHANNEL: Channel<TelemetryCurves> | null = null;

export const subscribeDiagram = (
  metadata: SldMetadata,
  handler: (ti: TelemetryCurves) => void,
) =>
  Effect.gen(function* () {
    const CHANNEL = new Channel<TelemetryCurves>();

    ACTIVE_CHANNEL = new Channel<TelemetryCurves>();
    ACTIVE_CHANNEL.onmessage = (event) => {
      console.log(`Channel received message: ${JSON.stringify(event)}`);
      handler(event);
    };

    return yield* Effect.tryPromise({
      try: () =>
        invoke<SldSubscriptionResponse>('subscribe_diagram', {
          metadata,
          channel: CHANNEL,
        }),
      catch: (error) => new SubscriptionSLDError(error),
    });
  });

export const unsubscribeDiagram = (metadata: SldMetadata) =>
  Effect.gen(function* () {
    const result = yield* Effect.tryPromise({
      try: () =>
        invoke<SldSubscriptionResponse>('unsubscribe_diagram', {
          metadata,
        }),
      catch: (error) => new SubscriptionSLDError(error),
    });
    ACTIVE_CHANNEL = null;
    return result;
  });
