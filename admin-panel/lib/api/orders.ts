import apiClient from './client';
import { API_ENDPOINTS, getFullUrl } from './endpoints';
import type { Order, OrderCreate, OrderUpdate, PaginatedResponse } from '@/types';

export const ordersApi = {
  list: async (params?: {
    order_status?: string;
    order_user?: number;
    order_product?: number;
    user_id?: number;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Order>> => {
    const response = await apiClient.get<PaginatedResponse<Order>>(
      getFullUrl(API_ENDPOINTS.orders),
      { params }
    );
    return response.data;
  },

  get: async (id: number): Promise<Order> => {
    const response = await apiClient.get<Order>(getFullUrl(API_ENDPOINTS.order(id)));
    return response.data;
  },

  create: async (data: OrderCreate): Promise<Order> => {
    const response = await apiClient.post<Order>(
      getFullUrl(API_ENDPOINTS.orders),
      data
    );
    return response.data;
  },

  update: async (id: number, data: OrderUpdate): Promise<Order> => {
    const response = await apiClient.patch<Order>(
      getFullUrl(API_ENDPOINTS.order(id)),
      data
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(getFullUrl(API_ENDPOINTS.order(id)));
  },

  softDelete: async (orderIds: number[]): Promise<void> => {
    await apiClient.delete(getFullUrl(API_ENDPOINTS.ordersSoftDelete), {
      data: { order_ids: orderIds },
    });
  },
};

