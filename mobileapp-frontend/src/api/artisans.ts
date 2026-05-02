import api from './axiosInstance';

export const artisanApi = {
  getAll: async () => {
    const response = await api.get('/artisans');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/artisans/${id}`);
    return response.data;
  }
};
