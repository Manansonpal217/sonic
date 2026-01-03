import apiClient from './client';
import { API_ENDPOINTS, getFullUrl } from './endpoints';

export interface LoginCredentials {
  user_email: string;
  user_password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  message?: string;
  user?: any;
  token?: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      getFullUrl(API_ENDPOINTS.login),
      credentials
    );
    return response.data;
  },

  logout: async (): Promise<void> => {
    // For Django session auth, logout might not be needed on frontend
    // But if there's a logout endpoint, call it here
    // await apiClient.post(getFullUrl('/api/logout'));
  },
};


