import { Atom } from '@effect-atom/atom-react';
import { Effect, Layer, Logger } from 'effect';

import { Metadata } from '../types/metadata.type';

import { PowsyblClient, PowsyblError } from '@/services/common/powsybl-client';
import { SldMetadata } from '@/types/sld-metadata';
import { EcsClient } from '@/services/common/ecs-client/client';
import { Channel } from '@tauri-apps/api/core';
import { DiagramEvent } from '@/types/diagram-event';

const runtimeAtom = Atom.runtime(
  Layer.mergeAll(PowsyblClient.Default, EcsClient.Default, Logger.pretty),
);

export const loadSldMetadata = Atom.family((elementId: string) =>
  runtimeAtom.fn(
    Effect.fn(function* () {
      const powsyblClient = yield* PowsyblClient;

      const metadata = yield* powsyblClient.getSingleLineDiagram({
        element_id: elementId,
      });

      if (!metadata.metadata) {
        return yield* Effect.fail(
          new PowsyblError({ message: `Metadata is empty: ${elementId}` }),
        );
      }

      if (!metadata.svg_content) {
        return yield* Effect.fail(
          new PowsyblError({ message: `Svg is empty: ${elementId}` }),
        );
      }

      return {
        metadata: metadata.metadata as unknown as SldMetadata,
        svg: metadata.svg_content,
      } as Metadata;
    }),
  ),
);

export const addChannelFeeders = Atom.family(
  ({
    elementId,
    channel,
  }: {
    elementId: string;
    channel: Channel<DiagramEvent>;
  }) =>
    runtimeAtom.fn(
      Effect.fn(function* () {
        const ecsClient = yield* EcsClient;

        // Vérifier si une subscription existe déjà
        const hasSubscription = yield* ecsClient.has_subscription({
          elementId,
        });

        if (hasSubscription) {
          yield* Effect.log(`Channel already exists for: ${elementId}`);
          const existingChannel = yield* ecsClient.get_subscription_channel({
            elementId,
          });
          return { channel: existingChannel, isNew: false } as const;
        }

        // Créer une nouvelle subscription
        yield* ecsClient.add_subscription({ elementId, channel });
        yield* Effect.log(`Add channel: ${elementId}`);

        return { channel, isNew: true } as const;
      }),
    ),
);

export const removeChannelFeeders = Atom.family(
  ({ elementId }: { elementId: string }) =>
    runtimeAtom.fn(
      Effect.fn(function* () {
        const ecsClient = yield* EcsClient;
        yield* ecsClient.remove_subscription({ elementId });
      }),
    ),
);

export const getChannelFeeders = Atom.family(
  ({ elementId }: { elementId: string }) =>
    runtimeAtom.fn(
      Effect.fn(function* () {
        const ecsClient = yield* EcsClient;

        // Vérifier si une subscription existe déjà
        const hasSubscription = yield* ecsClient.has_subscription({
          elementId,
        });

        if (hasSubscription) {
          // Récupérer le channel existant
          const existingChannel = yield* ecsClient.get_subscription_channel({
            elementId,
          });
          yield* Effect.log(`Channel found for: ${elementId}`);
          return { channel: existingChannel, isNew: false } as const;
        }

        return yield* Effect.fail(
          new Error(`No channel found for element: ${elementId}`),
        );
      }),
    ),
);
