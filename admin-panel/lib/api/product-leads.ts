import apiClient from './client';
import { API_ENDPOINTS, getFullUrl } from './endpoints';
import type { PaginatedResponse } from '@/types';

export interface ProductLead {
  id: number;
  product: number;
  product_name?: string;
  company_name: string;
  phone_number: string;
  quantity: number;
  user_name?: string | null;
  email?: string | null;
  gst?: string | null;
  address?: string | null;
  submitted_by: number;
  submitted_by_username?: string;
  created_at: string;
  updated_at: string;
}

export const productLeadsApi = {
  list: async (params?: {
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<ProductLead>> => {
    const response = await apiClient.get<PaginatedResponse<ProductLead>>(
      getFullUrl(API_ENDPOINTS.productLeads),
      { params }
    );
    return response.data;
  },

  get: async (id: number): Promise<ProductLead> => {
    const response = await apiClient.get<ProductLead>(
      getFullUrl(API_ENDPOINTS.productLead(id))
    );
    return response.data;
  },
};
