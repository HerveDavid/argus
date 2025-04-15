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

export interface FetchStatus {
  success: boolean;
  message: string;
}
