import apiClient from './client';
import { API_ENDPOINTS, getFullUrl } from './endpoints';
import type { CustomizeOrder, PaginatedResponse } from '@/types';

export interface CustomizeOrderCreate {
  customize_user: number;
  order_image?: File | null;
  order_audio?: File | null;
  order_description?: string | null;
  order_status?: 'pending' | 'reviewing' | 'in_progress' | 'completed' | 'rejected';
}

export interface CustomizeOrderUpdate {
  customize_user?: number;
  order_image?: File | null;
  order_audio?: File | null;
  order_description?: string | null;
  order_status?: 'pending' | 'reviewing' | 'in_progress' | 'completed' | 'rejected';
}

export const customizeOrdersApi = {
  list: async (params?: {
    order_status?: string;
    customize_user?: number;
    user_id?: number;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<CustomizeOrder>> => {
    const response = await apiClient.get<PaginatedResponse<CustomizeOrder>>(
      getFullUrl(API_ENDPOINTS.customizeOrders),
      { params }
    );
    return response.data;
  },

  get: async (id: number): Promise<CustomizeOrder> => {
    const response = await apiClient.get<CustomizeOrder>(
      getFullUrl(API_ENDPOINTS.customizeOrder(id))
    );
    return response.data;
  },

  create: async (data: CustomizeOrderCreate): Promise<CustomizeOrder> => {
    const formData = new FormData();
    formData.append('customize_user', String(data.customize_user));
    if (data.order_image) formData.append('order_image', data.order_image);
    if (data.order_audio) formData.append('order_audio', data.order_audio);
    if (data.order_description) formData.append('order_description', data.order_description);
    if (data.order_status) formData.append('order_status', data.order_status);

    const response = await apiClient.post<CustomizeOrder>(
      getFullUrl(API_ENDPOINTS.customizeOrders),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  update: async (id: number, data: CustomizeOrderUpdate): Promise<CustomizeOrder> => {
    const formData = new FormData();
    if (data.customize_user) formData.append('customize_user', String(data.customize_user));
    if (data.order_image) formData.append('order_image', data.order_image);
    if (data.order_audio) formData.append('order_audio', data.order_audio);
    if (data.order_description !== undefined) formData.append('order_description', data.order_description || '');
    if (data.order_status) formData.append('order_status', data.order_status);

    const response = await apiClient.patch<CustomizeOrder>(
      getFullUrl(API_ENDPOINTS.customizeOrder(id)),
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
    await apiClient.delete(getFullUrl(API_ENDPOINTS.customizeOrder(id)));
  },
};

