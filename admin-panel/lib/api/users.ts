import apiClient from './client';
import { API_ENDPOINTS, getFullUrl } from './endpoints';
import type { User, UserCreate, UserUpdate, PaginatedResponse } from '@/types';

export const usersApi = {
  list: async (params?: {
    user_status?: boolean;
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<User>> => {
    const response = await apiClient.get<PaginatedResponse<User>>(
      getFullUrl(API_ENDPOINTS.users),
      { params }
    );
    return response.data;
  },

  get: async (id: number): Promise<User> => {
    const response = await apiClient.get<User>(getFullUrl(API_ENDPOINTS.user(id)));
    return response.data;
  },

  create: async (data: UserCreate): Promise<User> => {
    const response = await apiClient.post<User>(
      getFullUrl(API_ENDPOINTS.users),
      data
    );
    return response.data;
  },

  update: async (id: number, data: UserUpdate): Promise<User> => {
    const response = await apiClient.patch<User>(
      getFullUrl(API_ENDPOINTS.user(id)),
      data
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(getFullUrl(API_ENDPOINTS.user(id)));
  },

  softDelete: async (userIds: number[]): Promise<void> => {
    await apiClient.delete(getFullUrl(API_ENDPOINTS.usersSoftDelete), {
      data: { user_ids: userIds },
    });
  },
};


