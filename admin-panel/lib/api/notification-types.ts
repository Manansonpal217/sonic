import apiClient from './client';
import { API_ENDPOINTS, getFullUrl } from './endpoints';
import type { NotificationType, PaginatedResponse } from '@/types';

export interface NotificationTypeCreate {
  notif_name: string;
  notif_status?: boolean;
}

export interface NotificationTypeUpdate {
  notif_name?: string;
  notif_status?: boolean;
}

export const notificationTypesApi = {
  list: async (params?: {
    notif_status?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<NotificationType>> => {
    const response = await apiClient.get<PaginatedResponse<NotificationType>>(
      getFullUrl(API_ENDPOINTS.notificationTypes),
      { params }
    );
    return response.data;
  },

  get: async (id: number): Promise<NotificationType> => {
    const response = await apiClient.get<NotificationType>(
      getFullUrl(API_ENDPOINTS.notificationType(id))
    );
    return response.data;
  },

  create: async (data: NotificationTypeCreate): Promise<NotificationType> => {
    const response = await apiClient.post<NotificationType>(
      getFullUrl(API_ENDPOINTS.notificationTypes),
      data
    );
    return response.data;
  },

  update: async (id: number, data: NotificationTypeUpdate): Promise<NotificationType> => {
    const response = await apiClient.patch<NotificationType>(
      getFullUrl(API_ENDPOINTS.notificationType(id)),
      data
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(getFullUrl(API_ENDPOINTS.notificationType(id)));
  },
};


