import { MetadataGrid } from '../types/metadata-grid';
import network from './simple-eu_metadata.json';

export const getMetadataGrid = (): Promise<{ data: MetadataGrid }> => {
  const data: MetadataGrid = network;

  return Promise.resolve({ data });
};
