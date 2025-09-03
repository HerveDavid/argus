import { Atom } from '@effect-atom/atom-react';
import { Effect, Layer } from 'effect';

import { Metadata } from '../types/metadata.type';

import { PowsyblClient, PowsyblError } from '@/services/common/powsybl-client';
import { SldMetadata } from '@/types/sld-metadata';

const runtimeAtom = Atom.runtime(Layer.mergeAll(PowsyblClient.Default));

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
