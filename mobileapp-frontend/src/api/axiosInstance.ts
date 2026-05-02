import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
// @ts-ignore
import { API_BASE_URL, EXPO_PUBLIC_API_BASE_URL } from '@env';

const extra = Constants.expoConfig?.extra ?? {};
const rawBaseUrl =
  extra.API_BASE_URL ??
  extra.EXPO_PUBLIC_API_BASE_URL ??
  EXPO_PUBLIC_API_BASE_URL ??
  API_BASE_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  process.env.API_BASE_URL ??
  'http://localhost:5000';

const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '').replace(/\/api$/, '');

const api = axios.create({
  baseURL: normalizedBaseUrl + '/api',
  headers: { 'Content-Type': 'application/json' },
});

console.log('🔗 [axiosInstance] Configured API baseURL:', api.defaults.baseURL);

// ── RELIABLE TOKEN GETTER ──────────────────────────────────
const getAuthToken = async (): Promise<string | null> => {
  try {
    // We now use a unified 'auth_token' for all roles
    return await AsyncStorage.getItem('auth_token');
  } catch (err) {
    console.error('Error reading auth_token:', err);
    return null;
  }
};

// ── INTERCEPTOR ──────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const adminToken = await AsyncStorage.getItem('admin_token');
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  }

  // Set actor headers (required by Reviews API)
  const sessionUserRaw = await AsyncStorage.getItem('lankaCraftAuthUser');
  if (sessionUserRaw) {
    try {
      const user = JSON.parse(sessionUserRaw);
      if (user.email) config.headers['x-user-email'] = user.email;
      if (user.role) config.headers['x-user-role'] = user.role;
      if (user.username) config.headers['x-username'] = user.username;
    } catch {
      // ignore parse error
    }
  }

  return config;
}, (error) => {
  console.error('❌ [axiosInstance] Request Error:', error.message);
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Optionally handle 401 Unauthorized globally
    if (error.response?.status === 401) {
      console.warn('⚠️ [axiosInstance] Unauthorized - may need to re-login');
    }
    console.error('❌ [axiosInstance] Response Error:', error.message, error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export default api;