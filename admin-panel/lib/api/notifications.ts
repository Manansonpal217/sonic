import apiClient from './client';
import { API_ENDPOINTS, getFullUrl } from './endpoints';
import type { Notification, PaginatedResponse } from '@/types';

export interface NotificationCreate {
  notification_user: number;
  notification_type: number;
  notification_title: string;
  notification_message?: string | null;
}

export interface NotificationUpdate {
  notification_user?: number;
  notification_type?: number;
  notification_title?: string;
  notification_message?: string | null;
  notification_read?: boolean;
}

export const notificationsApi = {
  list: async (params?: {
    notification_read?: boolean;
    notification_user?: number;
    notification_type?: number;
    user_id?: number;
    read?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Notification>> => {
    const response = await apiClient.get<PaginatedResponse<Notification>>(
      getFullUrl(API_ENDPOINTS.notifications),
      { params }
    );
    return response.data;
  },

  get: async (id: number): Promise<Notification> => {
    const response = await apiClient.get<Notification>(
      getFullUrl(API_ENDPOINTS.notification(id))
    );
    return response.data;
  },

  create: async (data: NotificationCreate): Promise<Notification> => {
    const response = await apiClient.post<Notification>(
      getFullUrl(API_ENDPOINTS.notifications),
      data
    );
    return response.data;
  },

  update: async (id: number, data: NotificationUpdate): Promise<Notification> => {
    const response = await apiClient.patch<Notification>(
      getFullUrl(API_ENDPOINTS.notification(id)),
      data
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(getFullUrl(API_ENDPOINTS.notification(id)));
  },

  markRead: async (id: number): Promise<Notification> => {
    const response = await apiClient.patch<Notification>(
      getFullUrl(API_ENDPOINTS.notificationMarkRead(id))
    );
    return response.data;
  },

  markAllRead: async (userId: number): Promise<void> => {
    await apiClient.post(getFullUrl(API_ENDPOINTS.notificationsMarkAllRead), {
      user_id: userId,
    });
  },
};

