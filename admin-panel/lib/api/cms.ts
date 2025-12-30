import apiClient from './client';
import { API_ENDPOINTS, getFullUrl } from './endpoints';
import type { CMSPage, PaginatedResponse } from '@/types';

export interface CMSCreate {
  cms_title: string;
  cms_slug?: string;
  cms_content?: string | null;
  cms_status?: boolean;
}

export interface CMSUpdate {
  cms_title?: string;
  cms_slug?: string;
  cms_content?: string | null;
  cms_status?: boolean;
}

export const cmsApi = {
  list: async (params?: {
    cms_status?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<CMSPage>> => {
    const response = await apiClient.get<PaginatedResponse<CMSPage>>(
      getFullUrl(API_ENDPOINTS.cms),
      { params }
    );
    return response.data;
  },

  get: async (slug: string): Promise<CMSPage> => {
    const response = await apiClient.get<CMSPage>(
      getFullUrl(API_ENDPOINTS.cmsBySlug(slug))
    );
    return response.data;
  },

  getActive: async (): Promise<CMSPage[]> => {
    const response = await apiClient.get<CMSPage[]>(
      getFullUrl(API_ENDPOINTS.cmsActive)
    );
    return response.data;
  },

  create: async (data: CMSCreate): Promise<CMSPage> => {
    const response = await apiClient.post<CMSPage>(
      getFullUrl(API_ENDPOINTS.cms),
      data
    );
    return response.data;
  },

  update: async (slug: string, data: CMSUpdate): Promise<CMSPage> => {
    const response = await apiClient.patch<CMSPage>(
      getFullUrl(API_ENDPOINTS.cmsBySlug(slug)),
      data
    );
    return response.data;
  },

  delete: async (slug: string): Promise<void> => {
    await apiClient.delete(getFullUrl(API_ENDPOINTS.cmsBySlug(slug)));
  },
};

