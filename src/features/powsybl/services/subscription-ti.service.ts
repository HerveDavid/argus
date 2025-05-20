import { Channel, invoke } from '@tauri-apps/api/core';
import { Effect } from 'effect';
import { TelemetryCurves } from '../types/telemetry-curves.type';
import { SldMetadata } from '../types/sld-metatada.type';

// ------------------------------
// Model
// ------------------------------

interface SldSubscriptionResponse {
  readonly _tag: 'SldSubscriptionStatus';
  readonly status: 'connected' | 'disconnected';
}

class SubscriptionSLDError extends Error {
  readonly _tag = 'SubscriptionSLDError';

  constructor(id: string, error: any) {
    super(`Failed to SLD (${id}): ${error}`);
  }
}

// ------------------------------
// External API
// ------------------------------

const channels = new Map<string, Channel<TelemetryCurves>>();

export const subscribeSLD = (
  id: string,
  sld_metadata: SldMetadata,
  handler: (ti: TelemetryCurves) => void,
) =>
  Effect.gen(function* () {
    // Réutilisation d'un canal existant
    if (channels.has(id)) {
      return { status: 'connected', _tag: 'SldSubscriptionStatus' } as const;
    }

    // Création d'un nouveau canal
    const on_event = new Channel<TelemetryCurves>();
    on_event.onmessage = handler;
    channels.set(id, on_event);

    // Invocation de l'API Tauri
    return yield* Effect.tryPromise({
      try: () =>
        invoke<SldSubscriptionResponse>('subscribe_single_line_diagram', {
          sld_metadata,
          on_event,
        }),
      catch: (error) => new SubscriptionSLDError(id, error),
    });
  });

export const unsubscribeSLD = (id: string, sld_metadata: SldMetadata) =>
  Effect.gen(function* () {
    if (channels.delete(id)) {
      return yield* Effect.tryPromise({
        try: () =>
          invoke<SldSubscriptionResponse>('unsubscribe_single_line_diagram', {
            sld_metadata,
          }),
        catch: (error) => new SubscriptionSLDError(id, error),
      });
    }

    return yield* Effect.fail(
      new SubscriptionSLDError(id, 'No existed in channel map'),
    );
  });

export const connectBroker = (
  substation_id: string,
  metadata: SldMetadata,
  handler: (values: Record<string, number>) => void,
) =>
  Effect.gen(function* () {
    // Création d'un nouveau channel
    const channel = new Channel<Record<string, number>>();
    channel.onmessage = handler;

    // Invocation de l'API Tauri
    return yield* Effect.tryPromise({
      try: () =>
        invoke<SldSubscriptionResponse>('connect_broker', {
          substation_id,
          metadata,
          channel,
        }),
      catch: (error) => console.error(error),
    });
  });

export const disconnectBroker = (substation_id: string) =>
  Effect.gen(function* () {
    // Invocation de l'API Tauri
    return yield* Effect.tryPromise({
      try: () =>
        invoke<SldSubscriptionResponse>('disconnect_broker', {
          substation_id,
        }),
      catch: (error) => console.error(error),
    });
  });
