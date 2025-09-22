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

        yield* ecsClient.add_subscription({ elementId, channel });
        yield* Effect.log(`Add channel: ${elementId} ${channel}`);

        console.log('cou');

        yield* Effect.sync(() => console.log(`Add channel: ${elementId}`));

        return {
          channel,
        } as const;
      }),
    ),
);

export const unloadSldMetadata = Atom.family((elementId: string) =>
  runtimeAtom.fn(
    Effect.fn(function* () {
      const ecsClient = yield* EcsClient;
      yield* ecsClient.remove_subscription({ elementId });
    }),
  ),
);
