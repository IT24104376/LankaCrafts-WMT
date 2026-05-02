import api from '../api/axiosInstance';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const registerTourist = (data: object) =>
  api.post('/tourist/auth/register', data);

export const loginTourist = (data: object) =>
  api.post('/tourist/auth/login', data);

// ── Profile ───────────────────────────────────────────────────────────────────

export const getProfile = () =>
  api.get('/tourist/profile');

export const updateProfile = (data: object) =>
  api.patch('/tourist/profile', data);

export const uploadProfilePic = (formData: FormData) =>
  api.post('/tourist/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getStats = () =>
  api.get('/tourist/stats');

export const getSavedWorkshops = () =>
  api.get('/tourist/saved-workshops');

export const addSavedWorkshop = (workshopId: number | string) =>
  api.post('/tourist/saved-workshops', { workshopId });

export const removeSavedWorkshop = (workshopId: number | string) =>
  api.delete(`/tourist/saved-workshops/${workshopId}`);

export const getReviews = (params?: object) =>
  api.get('/reviews', { params });

export const updateReviews = (reviewIds: string[]) =>
  api.post('/tourist/reviews', { reviewIds });

// ── Blogs ─────────────────────────────────────────────────────────────────────

export const getBlogs = (page = 1, sort = 'recent', tag?: string) => {
  const tagParam = tag ? `&tag=${encodeURIComponent(tag)}` : '';
  return api.get(`/tourist/blogs?page=${page}&sort=${sort}${tagParam}`);
};

export const getBlog = (id: string) =>
  api.get(`/tourist/blogs/${id}`);

export const getMyBlogs = () =>
  api.get('/tourist/blogs/me');

export const createBlog = (formData: FormData) =>
  api.post('/tourist/blogs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateBlog = (id: string, formData: FormData) =>
  api.patch(`/tourist/blogs/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const likeBlog = (id: string) =>
  api.patch(`/tourist/blogs/${id}/like`);

export const deleteBlog = (id: string) =>
  api.delete(`/tourist/blogs/${id}`);

// ── Artist Auth ─────────────────────────────────────────────────────────────────

export const registerArtist = (data: object) =>
  api.post('/artist/auth/register', data);

export const loginArtist = (data: object) =>
  api.post('/artist/auth/login', data);

// ── Artist Profile ─────────────────────────────────────────────────────────────

export const getArtistProfile = () =>
  api.get('/artist/profile');

export const updateArtistProfile = (data: object) =>
  api.patch('/artist/profile', data);

// ── Artist Bookings ────────────────────────────────────────────────────────────

export const getArtistBookings = () =>
  api.get('/artist/bookings');

// ── Artist Schedule ────────────────────────────────────────────────────────────

export const getArtistSchedule = () =>
  api.get('/artist/schedule');

export const updateArtistSchedule = (data: object) =>
  api.patch('/artist/schedule', data);

// ── Artist Crafts ──────────────────────────────────────────────────────────────

export const createCraft = (data: object) =>
  api.post('/crafts', data);

export const updateCraft = (id: string, data: object) =>
  api.patch(`/crafts/${id}`, data);

export const deleteCraft = (id: string) =>
  api.delete(`/crafts/${id}`);

// ── Public Crafts ────────────────────────────────────────────────────────────

export const getPublicCraft = (id: string) =>
  api.get(`/crafts/public/crafts/${id}`);

export const getPublicCrafts = (page = 1, limit = 20, category?: string, search?: string, artistId?: string) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (category) params.append('category', category);
  if (search) params.append('search', search);
  if (artistId) params.append('artistId', artistId);
  return api.get(`/crafts/public/crafts?${params.toString()}`);
};

export const updatePublicCraft = (id: string, data: object) =>
  api.patch(`/crafts/public/crafts/${id}`, data);

// ── Public Artists ────────────────────────────────────────────────────────────

export const getArtists = (page = 1, limit = 20, craftType?: string, search?: string) => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (craftType) params.append('craftType', craftType);
  if (search) params.append('search', search);
  return api.get(`/artists?${params.toString()}`);
};

export const getArtistById = (id: string) =>
  api.get(`/artists/${id}`);

export const getFeaturedArtist = () =>
  api.get('/artists/featured');

export default api;
