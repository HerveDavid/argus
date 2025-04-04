import { ServerUrlServiceLive } from '@/features/settings/url/services/server-url';
import { StoreServiceLive } from '@/utils/store-service';
import { Layer } from 'effect';

// Création de la couche de services
export const ServicesLive = Layer.mergeAll(
  StoreServiceLive,
  ServerUrlServiceLive,
);
