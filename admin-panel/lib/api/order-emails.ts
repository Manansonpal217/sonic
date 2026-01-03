import apiClient from './client';
import { API_ENDPOINTS, getFullUrl } from './endpoints';
import type { OrderEmail, PaginatedResponse } from '@/types';

export interface OrderEmailCreate {
  mail_from: string;
  mail_to: string;
  mail_subject: string;
  mail_content: string;
  mail_user?: string | null;
  mail_status?: boolean;
}

export interface OrderEmailUpdate {
  mail_from?: string;
  mail_to?: string;
  mail_subject?: string;
  mail_content?: string;
  mail_user?: string | null;
  mail_status?: boolean;
}

export const orderEmailsApi = {
  list: async (params?: {
    mail_status?: boolean;
    mail_to?: string;
    mail_from?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<OrderEmail>> => {
    const response = await apiClient.get<PaginatedResponse<OrderEmail>>(
      getFullUrl(API_ENDPOINTS.orderEmails),
      { params }
    );
    return response.data;
  },

  get: async (id: number): Promise<OrderEmail> => {
    const response = await apiClient.get<OrderEmail>(
      getFullUrl(API_ENDPOINTS.orderEmail(id))
    );
    return response.data;
  },

  create: async (data: OrderEmailCreate): Promise<OrderEmail> => {
    const response = await apiClient.post<OrderEmail>(
      getFullUrl(API_ENDPOINTS.orderEmails),
      data
    );
    return response.data;
  },

  update: async (id: number, data: OrderEmailUpdate): Promise<OrderEmail> => {
    const response = await apiClient.patch<OrderEmail>(
      getFullUrl(API_ENDPOINTS.orderEmail(id)),
      data
    );
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(getFullUrl(API_ENDPOINTS.orderEmail(id)));
  },
};


