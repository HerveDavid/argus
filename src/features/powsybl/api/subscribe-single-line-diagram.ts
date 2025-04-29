import { SldMetadata } from '../types/sld-metatada.type';
import { SldSubscriptionResponse } from '../types/sld-subscription.type';
import { invoke, Channel } from '@tauri-apps/api/core';
import { handleApiError } from '@/lib/api-utils';
import { TelemetryCurves } from '../types/telemetry-curves.type';

const channels = new Map<string, Channel<TelemetryCurves>>();

export const subscribeSingleLineDiagram = async (
  id: string,
  sld_metadata: SldMetadata,
  handler: (tc: TelemetryCurves) => void,
): Promise<SldSubscriptionResponse> => {
  try {
    if (channels.has(id)) {
      return { status: 'connected' };
    }

    const on_event = new Channel<TelemetryCurves>();
    on_event.onmessage = handler;

    channels.set(id, on_event);

    const response = await invoke<SldSubscriptionResponse>(
      'plugin:powsybl|subscribe_single_line_diagram',
      { sld_metadata, on_event },
    );

    return response;
  } catch (error) {
    throw handleApiError(error, 'Error subscribing to sld');
  }
};

export const unsubscribeSingleLineDiagram = async (
  id: string,
  sld_metadata: SldMetadata,
): Promise<SldSubscriptionResponse> => {
  try {
    channels.delete(id);

    const response = await invoke<SldSubscriptionResponse>(
      'plugin:powsybl|unsubscribe_single_line_diagram',
      { sld_metadata },
    );
    return response;
  } catch (error) {
    throw handleApiError(error, 'Error unsubscribing to sld');
  }
};
