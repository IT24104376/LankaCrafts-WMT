import api from './axiosInstance';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginAdmin = (email: string, password: string) =>
  api.post('/auth/login', { email, password });

export const getMe = () => api.get('/auth/me');

// ── Artisans ──────────────────────────────────────────────────────────────────
export const getArtisans = (params?: Record<string, string>) =>
  api.get('/admin/artisans', { params });

export const updateArtisanStatus = (id: string, status: string) =>
  api.patch(`/admin/artisans/${id}/status`, { status });

// ── Tourists ──────────────────────────────────────────────────────────────────
export const getTourists = (params?: Record<string, string>) =>
  api.get('/admin/tourists', { params });

export const toggleTouristStatus = (id: string) =>
  api.patch(`/admin/tourists/${id}/status`);
