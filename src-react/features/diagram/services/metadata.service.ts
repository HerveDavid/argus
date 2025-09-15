import { Atom } from '@effect-atom/atom-react';
import { Effect, Layer } from 'effect';

import { Metadata } from '../types/metadata.type';

import { PowsyblClient, PowsyblError } from '@/services/common/powsybl-client';
import { SldMetadata } from '@/types/sld-metadata';
import { EcsClient } from '@/services/common/ecs-client/client';
import { Channel } from '@tauri-apps/api/core';
import { DiagramEvent } from '@/types/diagram-event';

const runtimeAtom = Atom.runtime(
  Layer.mergeAll(PowsyblClient.Default, EcsClient.Default),
);

export const loadSldMetadata = Atom.family((elementId: string) =>
  runtimeAtom.fn(
    Effect.fn(function* () {
      const powsyblClient = yield* PowsyblClient;
      const ecsClient = yield* EcsClient;

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

      const channel = new Channel<DiagramEvent>();
      channel.onmessage = console.log;
      yield* ecsClient.add_subscription({ elementId, channel });

      return {
        metadata: metadata.metadata as unknown as SldMetadata,
        svg: metadata.svg_content,
      } as Metadata;
    }),
  ),
);


export const loadSldMetadataV2 = Atom.family((elementId: string) =>
  runtimeAtom.fn(
    Effect.fn(function* () {
      const powsyblClient = yield* PowsyblClient;
      const ecsClient = yield* EcsClient;

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

      const channel = new Channel<DiagramEvent>();
      yield* ecsClient.add_subscription({ elementId, channel });

      return {
        metadata: metadata.metadata as unknown as SldMetadata,
        svg: metadata.svg_content,
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
