import apiClient from './client';
import { API_ENDPOINTS, getFullUrl } from './endpoints';

export interface Category {
  id: number;
  category_name: string;
  category_description?: string;
  category_image?: string;
  category_status: boolean;
  display_order: number;
  products_count: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  category_name: string;
  category_description?: string;
  category_image?: File | null;
  category_status?: boolean;
  display_order?: number;
}

export interface CategoryUpdate {
  category_name?: string;
  category_description?: string;
  category_image?: File | null;
  category_status?: boolean;
  display_order?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const categoriesApi = {
  list: async (params?: {
    category_status?: boolean;
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Category>> => {
    const response = await apiClient.get<PaginatedResponse<Category>>(
      getFullUrl(API_ENDPOINTS.categories),
      { params }
    );
    return response.data;
  },

  get: async (id: number): Promise<Category> => {
    const response = await apiClient.get<Category>(getFullUrl(API_ENDPOINTS.category(id)));
    return response.data;
  },

  create: async (data: CategoryCreate): Promise<Category> => {
    const formData = new FormData();
    formData.append('category_name', data.category_name);
    if (data.category_description) formData.append('category_description', data.category_description);
    if (data.category_image) formData.append('category_image', data.category_image);
    formData.append('category_status', String(data.category_status ?? true));

    const response = await apiClient.post<Category>(
      getFullUrl(API_ENDPOINTS.categories),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  update: async (id: number, data: CategoryUpdate): Promise<Category> => {
    const formData = new FormData();
    if (data.category_name) formData.append('category_name', data.category_name);
    if (data.category_description !== undefined) formData.append('category_description', data.category_description || '');
    if (data.category_image) formData.append('category_image', data.category_image);
    if (data.category_status !== undefined) formData.append('category_status', String(data.category_status));
    if (data.display_order !== undefined) formData.append('display_order', String(data.display_order));

    const response = await apiClient.patch<Category>(
      getFullUrl(API_ENDPOINTS.category(id)),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(getFullUrl(API_ENDPOINTS.category(id)));
  },

  getActive: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>(getFullUrl(API_ENDPOINTS.categoriesActive));
    return response.data;
  },

  softDelete: async (categoryIds: number[]): Promise<void> => {
    await apiClient.delete(getFullUrl(API_ENDPOINTS.categoriesSoftDelete), {
      data: { category_ids: categoryIds },
    });
  },
};


