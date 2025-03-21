import { MetadataGrid } from '../types/metadata-grid';
import network from './simple-eu_metadata.json';

export interface PaginationParams {
  page: number;
  pageSize: number;
  tabType: 'busNodes' | 'nodes' | 'edges';
}

export const getMetadataGrid = async ({
  page = 0,
  pageSize = 50,
  tabType,
}: PaginationParams): Promise<{
  data: MetadataGrid;
  totalPages: number;
}> => {
  const data: MetadataGrid = network;

  const startIndex = page * pageSize;
  const paginatedData = {
    ...data,
    [tabType]: data[tabType].slice(startIndex, startIndex + pageSize),
  };

  return Promise.resolve({
    data: paginatedData,
    totalPages: Math.ceil(data[tabType].length / pageSize),
  });
};
