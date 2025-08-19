import { PowsyblClient } from '@/services/common/powsybl-client';
import { Effect } from 'effect';

interface FeederService {}

export class FeederClient extends Effect.Service<FeederClient>()(
  '@/sld/FeederClient',
  {
    dependencies: [PowsyblClient.Default],
    effect: Effect.gen(function* () {
      return {} satisfies FeederService;
    }),
  },
) {}
