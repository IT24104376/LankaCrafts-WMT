import api from './axiosInstance';

export const touristApi = {
  register: async (data: any) => {
    const response = await api.post('/tourists/register', data);
    return response.data;
  },

  login: async (data: any) => {
    const response = await api.post('/tourists/login', data);
    return response.data;
  }
};
