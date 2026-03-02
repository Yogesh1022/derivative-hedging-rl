// ═══════════════════════════════════════════════════════════════
// AXIOS API CLIENT
// Centralized API configuration with interceptors
// ═══════════════════════════════════════════════════════════════

import axios, { AxiosInstance, AxiosError } from 'axios';

// API URL Configuration:
// - Development: '/api' (proxied by Vite to localhost:5000)
// - Production: Full URL from env (e.g., 'https://api.yourdomain.com/api')
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Send credentials (cookies, auth headers) with requests
  withCredentials: true,
});

// ═══════════════════════════════════════════════════════════════
// REQUEST INTERCEPTOR
// ═══════════════════════════════════════════════════════════════

apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('hedgeai_token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════════════════════════
// RESPONSE INTERCEPTOR
// ═══════════════════════════════════════════════════════════════

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as any;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (error.response.data?.code === 'TOKEN_EXPIRED') {
        if (!isRefreshing) {
          isRefreshing = true;
          originalRequest._retry = true;

          const refreshToken = localStorage.getItem('hedgeai_refresh_token');

          if (!refreshToken) {
            // No refresh token, redirect to login
            localStorage.clear();
            window.location.href = '/signin';
            return Promise.reject(error);
          }

          try {
            // Attempt to refresh token
            const response = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken,
            });

            const { token: newToken, refreshToken: newRefreshToken } = response.data.data;

            // Update stored tokens
            localStorage.setItem('hedgeai_token', newToken);
            localStorage.setItem('hedgeai_refresh_token', newRefreshToken);

            // Update authorization header
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            isRefreshing = false;
            onRefreshed(newToken);

            // Retry original request
            return apiClient(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            isRefreshing = false;
            localStorage.clear();
            window.location.href = '/signin';
            return Promise.reject(refreshError);
          }
        } else {
          // Wait for token refresh
          return new Promise((resolve) => {
            subscribeTokenRefresh((token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            });
          });
        }
      } else {
        // Other 401 errors, redirect to login
        localStorage.clear();
        window.location.href = '/signin';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
