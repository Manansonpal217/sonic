import apiClient from './client';
import { API_ENDPOINTS, getFullUrl } from './endpoints';
import type { Banner, PaginatedResponse } from '@/types';

export interface BannerCreate {
  banner_title: string;
  banner_image?: File | null;
  banner_product_id?: number | null;
  banner_status?: boolean;
  banner_order?: number;
}

export interface BannerUpdate {
  banner_title?: string;
  banner_image?: File | null;
  banner_product_id?: number | null;
  banner_status?: boolean;
  banner_order?: number;
}

export const bannersApi = {
  list: async (params?: {
    banner_status?: boolean;
    banner_product_id?: number;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Banner>> => {
    const response = await apiClient.get<PaginatedResponse<Banner>>(
      getFullUrl(API_ENDPOINTS.banners),
      { params }
    );
    return response.data;
  },

  get: async (id: number): Promise<Banner> => {
    const response = await apiClient.get<Banner>(getFullUrl(API_ENDPOINTS.banner(id)));
    return response.data;
  },

  getActive: async (): Promise<Banner[]> => {
    const response = await apiClient.get<Banner[]>(
      getFullUrl(API_ENDPOINTS.bannersActive)
    );
    return response.data;
  },

  create: async (data: BannerCreate): Promise<Banner> => {
    const formData = new FormData();
    formData.append('banner_title', data.banner_title);
    if (data.banner_image) formData.append('banner_image', data.banner_image);
    if (data.banner_product_id) formData.append('banner_product_id', String(data.banner_product_id));
    formData.append('banner_status', String(data.banner_status ?? true));
    formData.append('banner_order', String(data.banner_order ?? 0));

    const response = await apiClient.post<Banner>(
      getFullUrl(API_ENDPOINTS.banners),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  update: async (id: number, data: BannerUpdate): Promise<Banner> => {
    const formData = new FormData();
    if (data.banner_title) formData.append('banner_title', data.banner_title);
    if (data.banner_image) formData.append('banner_image', data.banner_image);
    if (data.banner_product_id !== undefined) formData.append('banner_product_id', data.banner_product_id ? String(data.banner_product_id) : '');
    if (data.banner_status !== undefined) formData.append('banner_status', String(data.banner_status));
    if (data.banner_order !== undefined) formData.append('banner_order', String(data.banner_order));

    const response = await apiClient.patch<Banner>(
      getFullUrl(API_ENDPOINTS.banner(id)),
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
    await apiClient.delete(getFullUrl(API_ENDPOINTS.banner(id)));
  },
};

