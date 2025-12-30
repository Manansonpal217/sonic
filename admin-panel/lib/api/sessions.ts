import apiClient from './client';
import { API_ENDPOINTS, getFullUrl } from './endpoints';
import type { Session, PaginatedResponse } from '@/types';

export interface SessionCreate {
  session_user: number;
  session_key: string;
  fcm_token?: string | null;
  device_type?: string | null;
  expire_date: string;
}

export interface SessionUpdate {
  session_user?: number;
  session_key?: string;
  fcm_token?: string | null;
  device_type?: string | null;
  expire_date?: string;
}

export interface UpdateFcmTokenData {
  session_key: string;
  fcm_token: string;
  device_type?: string;
  user_id: number;
}

export const sessionsApi = {
  list: async (params?: {
    session_user?: number;
    device_type?: string;
    user_id?: number;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Session>> => {
    const response = await apiClient.get<PaginatedResponse<Session>>(
      getFullUrl(API_ENDPOINTS.sessions),
      { params }
    );
    return response.data;
  },

  get: async (id: number): Promise<Session> => {
    const response = await apiClient.get<Session>(getFullUrl(API_ENDPOINTS.session(id)));
    return response.data;
  },

  create: async (data: SessionCreate): Promise<Session> => {
    const response = await apiClient.post<Session>(
      getFullUrl(API_ENDPOINTS.sessions),
      data
    );
    return response.data;
  },

  update: async (id: number, data: SessionUpdate): Promise<Session> => {
    const response = await apiClient.patch<Session>(
      getFullUrl(API_ENDPOINTS.session(id)),
      data
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(getFullUrl(API_ENDPOINTS.session(id)));
  },

  updateFcmToken: async (data: UpdateFcmTokenData): Promise<void> => {
    await apiClient.post(getFullUrl(API_ENDPOINTS.sessionUpdateFcmToken), data);
  },
};

