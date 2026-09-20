import axios from 'axios';
import { env } from '@/config/environment';

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(normalizeApiError(error));
  }
);

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    return {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status || 0,
      code: error.response?.data?.code,
    };
  }
  return {
    message: error instanceof Error ? error.message : 'An unknown error occurred',
    status: 0,
  };
}
