import { Substation } from '@/types/substation';

export interface SubstationQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  country?: string;
  tso?: string;
}

export interface SubstationQueryResponse {
  substations: Substation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
