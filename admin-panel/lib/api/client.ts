import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for Django session auth
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add CSRF token if available (for Django)
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    // Handle errors globally
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      // Handle 401 Unauthorized
      if (status === 401) {
        // Redirect to login or handle auth error
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      // Handle 403 Forbidden
      if (status === 403) {
        toast.error('You do not have permission to perform this action');
      }

      // Handle 404 Not Found
      if (status === 404) {
        toast.error('Resource not found');
      }

      // Handle 500 Server Error
      if (status >= 500) {
        toast.error('Server error. Please try again later.');
      }

      // Handle validation errors (400)
      if (status === 400 && data) {
        const errorMessage = data.message || data.error || 'Validation error';
        if (typeof errorMessage === 'string') {
          toast.error(errorMessage);
        } else if (typeof errorMessage === 'object') {
          // Handle field errors
          const firstError = Object.values(errorMessage)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            toast.error(String(firstError[0]));
          }
        }
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred');
    }

    return Promise.reject(error);
  }
);

export default apiClient;

