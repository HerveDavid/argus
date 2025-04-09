import { SldMetadata } from '../types/sld-metatada.type';
import { SldSubscriptionResponse } from '../types/sld-subscription.type';
import { invoke } from '@tauri-apps/api/core';
import { handleApiError } from '@/lib/api-utils';

export const subscribeSingleLineDiagram = async (
  sld_metadata: SldMetadata,
): Promise<SldSubscriptionResponse> => {
  try {
    const response = await invoke<SldSubscriptionResponse>(
      'subscribe_single_line_diagram',
      { sld_metadata },
    );
    return response;
  } catch (error) {
    throw handleApiError(error, 'Error subscribing to sld');
  }
};

export const unsubscribeSingleLineDiagram = async (
  sld_metadata: SldMetadata,
): Promise<SldSubscriptionResponse> => {
  try {
    const response = await invoke<SldSubscriptionResponse>(
      'unsubscribe_single_line_diagram',
      { sld_metadata },
    );
    return response;
  } catch (error) {
    throw handleApiError(error, 'Error unsubscribing to sld');
  }
};
