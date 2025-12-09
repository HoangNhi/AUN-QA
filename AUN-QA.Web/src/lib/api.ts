import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { API_ENDPOINTS } from '@/config/constants';
import { getAccessToken } from './cookies';

export interface ApiResponse<T = any> {
  Data?: T;
  Message?: string;
  Success: boolean;
  StatusCode: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7213';

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseUrl: string) {
    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const original = error.config;

        // if (error.response?.status === 401 && original && !(original as any)._retry) {
        //   (original as any)._retry = true;

        //   const refreshToken = getRefreshToken();

        //   if (refreshToken) {
        //     try {
        //       const response = await axios.post(
        //         `${API_BASE_URL}${API_ENDPOINTS.User.REFRESH_TOKEN}`,
        //         { refreshToken }
        //       );

        //       const data = response.data;
        //       const newAccessToken =
        //         data.Data?.AccessToken || data.accessToken || data.Data?.accessToken;
        //       const newRefreshToken =
        //         data.Data?.RefreshToken || data.refreshToken || data.Data?.refreshToken;

        //       if (newAccessToken) {
        //         saveTokens(newAccessToken, newRefreshToken || refreshToken);
        //         original.headers.Authorization = `Bearer ${newAccessToken}`;
        //         return this.axiosInstance(original);
        //       }
        //     } catch (refreshError) {
        //       clearTokens();
        //       window.location.href = '/login';
        //       return Promise.reject(refreshError);
        //     }
        //   } else {
        //     clearTokens();
        //     window.location.href = '/login';
        //   }
        // }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get(endpoint, config);
    return response.data;
  }

  async post<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post(endpoint, data, config);
    return response.data;
  }

  async put<T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.put(endpoint, data, config);
    return response.data;
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete(endpoint, config);
    return response.data;
  }
}

export const api = new ApiClient(API_BASE_URL);

export default api;
