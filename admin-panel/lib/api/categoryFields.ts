import apiClient from './client';
import { API_ENDPOINTS, getFullUrl } from './endpoints';

export interface CategoryField {
  id: number;
  category: number;
  category_name: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'decimal' | 'select' | 'boolean' | 'textarea';
  field_options?: string;
  is_required: boolean;
  display_order: number;
  placeholder?: string;
  help_text?: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryFieldCreate {
  category: number;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'decimal' | 'select' | 'boolean' | 'textarea';
  field_options?: string;
  is_required?: boolean;
  display_order?: number;
  placeholder?: string;
  help_text?: string;
}

export interface CategoryFieldUpdate {
  field_name?: string;
  field_label?: string;
  field_type?: 'text' | 'number' | 'decimal' | 'select' | 'boolean' | 'textarea';
  field_options?: string;
  is_required?: boolean;
  display_order?: number;
  placeholder?: string;
  help_text?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const categoryFieldsApi = {
  list: async (params?: {
    category?: number;
    category_id?: number;
    field_type?: string;
    is_required?: boolean;
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<CategoryField>> => {
    const response = await apiClient.get<PaginatedResponse<CategoryField>>(
      getFullUrl(API_ENDPOINTS.categoryFields),
      { params }
    );
    return response.data;
  },

  get: async (id: number): Promise<CategoryField> => {
    const response = await apiClient.get<CategoryField>(getFullUrl(API_ENDPOINTS.categoryField(id)));
    return response.data;
  },

  create: async (data: CategoryFieldCreate): Promise<CategoryField> => {
    const response = await apiClient.post<CategoryField>(
      getFullUrl(API_ENDPOINTS.categoryFields),
      data
    );
    return response.data;
  },

  update: async (id: number, data: CategoryFieldUpdate): Promise<CategoryField> => {
    const response = await apiClient.patch<CategoryField>(
      getFullUrl(API_ENDPOINTS.categoryField(id)),
      data
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(getFullUrl(API_ENDPOINTS.categoryField(id)));
  },

  softDelete: async (fieldIds: number[]): Promise<void> => {
    await apiClient.delete(getFullUrl(API_ENDPOINTS.categoryFieldsSoftDelete), {
      data: { field_ids: fieldIds },
    });
  },
};


