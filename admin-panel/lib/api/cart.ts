import apiClient from './client';
import { API_ENDPOINTS, getFullUrl } from './endpoints';
import type { CartItem, PaginatedResponse } from '@/types';

export interface CartItemCreate {
  cart_user: number;
  cart_product: string;
  cart_quantity?: number;
  cart_status?: boolean;
}

export interface CartItemUpdate {
  cart_user?: number;
  cart_product?: string;
  cart_quantity?: number;
  cart_status?: boolean;
}

export const cartApi = {
  list: async (params?: {
    cart_status?: boolean;
    cart_user?: number;
    user_id?: number;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<CartItem>> => {
    const response = await apiClient.get<PaginatedResponse<CartItem>>(
      getFullUrl(API_ENDPOINTS.cart),
      { params }
    );
    return response.data;
  },

  get: async (id: number): Promise<CartItem> => {
    const response = await apiClient.get<CartItem>(getFullUrl(API_ENDPOINTS.cartItem(id)));
    return response.data;
  },

  create: async (data: CartItemCreate): Promise<CartItem> => {
    const response = await apiClient.post<CartItem>(
      getFullUrl(API_ENDPOINTS.cart),
      data
    );
    return response.data;
  },

  update: async (id: number, data: CartItemUpdate): Promise<CartItem> => {
    const response = await apiClient.patch<CartItem>(
      getFullUrl(API_ENDPOINTS.cartItem(id)),
      data
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(getFullUrl(API_ENDPOINTS.cartItem(id)));
  },

  clearCart: async (userId: number): Promise<void> => {
    await apiClient.post(getFullUrl(API_ENDPOINTS.cartClear), {
      user_id: userId,
    });
  },
};

