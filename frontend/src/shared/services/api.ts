import axios from "axios";
import { storage } from "../utils/storage";
import { LocalStorageKeys } from "../constants/storageKeys";
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import i18n from "../../i18n"

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/";
const API_PREFIX = "/api/v1";

export const api = axios.create({
  baseURL: `${BASE_URL.replace(/\/+$/, "")}${API_PREFIX}`,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// === Request Interceptor ===
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getRaw(LocalStorageKeys.AUTH_TOKEN);
    
    console.log('=== API REQUEST INTERCEPTOR DEBUG ===');
    console.log('Request URL:', config.url);
    console.log('Raw token from storage:', token?.substring(0, 30) + '...');
    console.log('Token starts with Bearer:', token?.startsWith('Bearer'));
    
    if (token && config.headers) {
      // 🔥 FIX: Kiểm tra xem token đã có "Bearer " prefix chưa
      if (token.startsWith('Bearer ')) {
        // Token đã có "Bearer " prefix, dùng trực tiếp
        config.headers.Authorization = token;
        console.log('✅ Token already has Bearer prefix, using directly');
      } else {
        // Token chưa có "Bearer " prefix, thêm vào
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Added Bearer prefix to token');
      }
      
      console.log('Final Authorization header:', config.headers.Authorization?.substring(0, 30) + '...');
    } else {
      console.log('❌ No token found in storage');
    }

    const language = storage.getRaw(LocalStorageKeys.LANGUAGE) || i18n.language
    if (config.headers) {
      config.headers["Accept-Language"] = language
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// === Response Interceptor ===
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('=== API RESPONSE SUCCESS ===');
    console.log('Response status:', response.status);
    console.log('Response URL:', response.config.url);
    return response;
  },
  async (error: AxiosError) => {
    console.error('=== API RESPONSE ERROR ===');
    console.error('Error status:', error.response?.status);
    console.error('Error URL:', error.config?.url);
    console.error('Error data:', error.response?.data);
    console.error('Request headers:', error.config?.headers);
    
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔄 Attempting token refresh for 401 error');
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const currentToken = storage.getRaw(LocalStorageKeys.AUTH_TOKEN);
          console.log('Current token for refresh:', currentToken?.substring(0, 30) + '...');
          
          // 🔥 FIX: Đảm bảo token refresh cũng có format đúng
          let authHeader = currentToken;
          if (currentToken && !currentToken.startsWith('Bearer ')) {
            authHeader = `Bearer ${currentToken}`;
          }
          
          const refreshResponse = await axios.post<{ token: string }>(
            `${BASE_URL.replace(/\/+$/, "")}${API_PREFIX}/users/auth/refresh/`,
            {},
            {
              headers: {
                Authorization: authHeader,
              },
            }
          );

          const newToken = refreshResponse.data.token;
          console.log('New token received:', newToken?.substring(0, 30) + '...');
          
          // 🔥 FIX: Lưu token mới với format đúng
          let tokenToStore = newToken;
          if (newToken && !newToken.startsWith('Bearer ')) {
            tokenToStore = `Bearer ${newToken}`;
          }
          
          storage.setRaw(LocalStorageKeys.AUTH_TOKEN, tokenToStore);
          console.log('New token stored:', tokenToStore?.substring(0, 30) + '...');
          
          onRefreshed(tokenToStore);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          
          [
            LocalStorageKeys.AUTH_TOKEN,
            LocalStorageKeys.AUTH_USER,
            LocalStorageKeys.DOCTOR_INFO,
            LocalStorageKeys.CURRENT_USER_ID,
            LocalStorageKeys.CURRENT_DOCTOR_ID,
            LocalStorageKeys.ADMIN_INFO,
            LocalStorageKeys.RECEPTIONIST_INFO,
          ].forEach((key) => storage.remove(key));

          window.location.href = "/login";
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          if (originalRequest.headers) {
            // Token đã có "Bearer " prefix từ onRefreshed
            originalRequest.headers.Authorization = token;
          }
          resolve(api(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);
