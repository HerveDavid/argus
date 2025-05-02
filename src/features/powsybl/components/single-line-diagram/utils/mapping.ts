import { TeleInformation } from '@/features/powsybl/types/tele-information.type';
import feeders from '@/../tests/dynawo/feeders_with_dynawo_id.json';

export const feeders_with_dynawo_id = feeders;

export function get_svg_id_from_dynawo_id(dynawo_id: string) {
  const feeder = feeders_with_dynawo_id.find((item) =>
    item.dynawo_id.includes(dynawo_id),
  );
  // Si un feeder correspondant est trouvé, renvoie un record avec found=true et l'id
  if (feeder) {
    return {
      found: true,
      id: feeder.id,
    };
  }

  // Sinon, renvoie un record avec found=false
  return {
    found: false,
  };
}

export function createTeleInformationFromDynawoId(
  dynawo_id: string,
  value: number,
): TeleInformation | undefined {
  const result = get_svg_id_from_dynawo_id(dynawo_id);

  if (result.found && result.id) {
    return {
      ti: 'TM',
      data: {
        id: result.id,
        value: value,
      },
    };
  }

  return undefined;
}

export function transformDynawoDataToTeleInformation(
  dynawoData: Record<string, number>,
): TeleInformation[] {
  const result: TeleInformation[] = [];

  for (const dynawoId in dynawoData) {
    const teleInfo = createTeleInformationFromDynawoId(
      dynawoId,
      dynawoData[dynawoId],
    );
    if (teleInfo) {
      result.push(teleInfo);
    }
  }

  return result;
}
