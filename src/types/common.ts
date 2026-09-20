export type Status = 'ACTIVE' | 'INACTIVE';

export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface FilterParams {
  search?: string;
  status?: Status;
  [key: string]: unknown;
}

export interface SelectOption {
  label: string;
  value: string;
}

export type ActionType = 'create' | 'edit' | 'view' | 'delete';
