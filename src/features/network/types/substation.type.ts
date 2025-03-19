export interface Substation {
  country: string;
  geo_tags: string;
  id: string;
  name: string;
  tso: string;
}

export interface Substations {
  substations: Substation[];
}

export interface PaginationParams {
  page: number;
  per_page: number;
}

export interface PaginatedResponse<T> {
  items: T;
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
