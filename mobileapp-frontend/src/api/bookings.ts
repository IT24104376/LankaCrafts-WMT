import api from './axiosInstance';

export interface BookingData {
  email?: string;
  touristEmail?: string;
  artisanId?: number | string | null;
  craftId?: string;
  date?: string;
  time?: string;
  timeSlot?: string;
  [key: string]: any;
}

export const bookingApi = {
  createBooking: async (data: BookingData) => {
    const response = await api.post('/bookings', data);
    return response.data;
  },

  getAllBookings: async () => {
    const response = await api.get('/bookings');
    return response.data;
  },

  getBookingsByEmail: async (email: string) => {
    const response = await api.get(`/bookings/user/${email}`);
    return response.data;
  },

  getBookingById: async (id: string) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  updateBooking: async (id: string, data: Partial<BookingData>) => {
    const response = await api.put(`/bookings/${id}`, data);
    return response.data;
  },

  deleteBooking: async (id: string) => {
    const response = await api.delete(`/bookings/${id}`);
    return response.data;
  }
};
