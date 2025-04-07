import { invokeTauri } from '@/utils/invoke-tauri';
import { SldMetadata } from '../types/sld-metatada';
import {
  ServerSldError,
  ServerSldResponse,
  createServerSldError,
} from '../types/server.type';

export const subscribeSingleLineDiagram = (sld_metadata: SldMetadata) =>
  invokeTauri<ServerSldResponse, ServerSldError>(
    'subscribe_single_line_diagram',
    { sld_metadata },
    createServerSldError,
  );

export const unsubscribeSingleLineDiagram = (sld_metadata: SldMetadata) =>
  invokeTauri<ServerSldResponse, ServerSldError>(
    'unsubscribe_single_line_diagram',
    { sld_metadata },
    createServerSldError,
  );
