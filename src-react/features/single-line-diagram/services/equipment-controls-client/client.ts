import { PowsyblClient } from '@/services/common/powsybl-client';
import { Effect } from 'effect';

interface EquipmentControlsService {}

export class EquipmentControlsClient extends Effect.Service<EquipmentControlsClient>()(
  '@/sld/FeederClient',
  {
    dependencies: [PowsyblClient.Default],
    effect: Effect.gen(function* () {
      return {} satisfies EquipmentControlsService;
    }),
  },
) {}
