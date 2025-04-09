import { SldMetadata } from '../types/sld-metatada.type';
import { SldSubscriptionResponse } from '../types/sld-subscription.type';
import { invoke, Channel } from '@tauri-apps/api/core';
import { handleApiError } from '@/lib/api-utils';
import { TeleInformation } from '../types/tele-information.type';

const channels = new Map<string, Channel<TeleInformation>>();

export const subscribeSingleLineDiagram = async (
  id: string,
  sld_metadata: SldMetadata,
): Promise<SldSubscriptionResponse> => {
  try {
    if (channels.has(id)) {
      return { status: 'connected' };
    }

    const on_event = new Channel<TeleInformation>();
    on_event.onmessage = (message) => {
      console.log(`Received teleinformation update:`, message);
      // Ici, vous pourriez déclencher une mise à jour du store ou émettre un événement
      // pour mettre à jour le SVG ou d'autres composants qui dépendent de ces données
    };

    channels.set(id, on_event);

    const response = await invoke<SldSubscriptionResponse>(
      'subscribe_single_line_diagram',
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
    // Vérifier si on a un channel pour ce diagramme
    if (!channels.has(id)) {
      return {
        status: 'disconnected',
      };
    }

    channels.delete(id);

    const response = await invoke<SldSubscriptionResponse>(
      'unsubscribe_single_line_diagram',
      { sld_metadata },
    );
    return response;
  } catch (error) {
    throw handleApiError(error, 'Error unsubscribing to sld');
  }
};
