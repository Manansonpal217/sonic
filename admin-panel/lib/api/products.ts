import apiClient from './client';
import { API_ENDPOINTS, getFullUrl } from './endpoints';
import type { Product, ProductCreate, ProductUpdate, PaginatedResponse } from '@/types';

export const productsApi = {
  list: async (params?: {
    product_status?: boolean;
    product_is_parent?: boolean;
    product_parent_id?: number;
    min_price?: number;
    max_price?: number;
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<PaginatedResponse<Product>>(
      getFullUrl(API_ENDPOINTS.products),
      { params }
    );
    return response.data;
  },

  get: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(getFullUrl(API_ENDPOINTS.product(id)));
    return response.data;
  },

  create: async (data: ProductCreate): Promise<Product> => {
    const formData = new FormData();
    formData.append('product_name', data.product_name);
    if (data.product_description) formData.append('product_description', data.product_description);
    formData.append('product_price', data.product_price);
    if (data.product_image) formData.append('product_image', data.product_image);
    if (data.product_form_response) formData.append('product_form_response', data.product_form_response);
    if (data.product_category !== undefined && data.product_category !== null) {
      formData.append('product_category', String(data.product_category));
    }
    formData.append('product_is_parent', String(data.product_is_parent ?? false));
    if (data.product_parent_id) formData.append('product_parent_id', String(data.product_parent_id));
    formData.append('product_status', String(data.product_status ?? true));

    const response = await apiClient.post<Product>(
      getFullUrl(API_ENDPOINTS.products),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  update: async (id: number, data: ProductUpdate): Promise<Product> => {
    const formData = new FormData();
    if (data.product_name) formData.append('product_name', data.product_name);
    if (data.product_description !== undefined) formData.append('product_description', data.product_description || '');
    if (data.product_price) formData.append('product_price', data.product_price);
    if (data.product_image) formData.append('product_image', data.product_image);
    if (data.product_form_response !== undefined) formData.append('product_form_response', data.product_form_response || '');
    if (data.product_category !== undefined) {
      formData.append('product_category', data.product_category !== null ? String(data.product_category) : '');
    }
    if (data.product_is_parent !== undefined) formData.append('product_is_parent', String(data.product_is_parent));
    if (data.product_parent_id !== undefined) formData.append('product_parent_id', data.product_parent_id ? String(data.product_parent_id) : '');
    if (data.product_status !== undefined) formData.append('product_status', String(data.product_status));

    const response = await apiClient.patch<Product>(
      getFullUrl(API_ENDPOINTS.product(id)),
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
    await apiClient.delete(getFullUrl(API_ENDPOINTS.product(id)));
  },

  getChildren: async (id: number): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>(
      getFullUrl(API_ENDPOINTS.productChildren(id))
    );
    return response.data;
  },

  softDelete: async (productIds: number[]): Promise<void> => {
    await apiClient.delete(getFullUrl(API_ENDPOINTS.productsSoftDelete), {
      data: { product_ids: productIds },
    });
  },
};


