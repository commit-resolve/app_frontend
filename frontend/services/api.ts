import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: async (data: { email: string; phone: string; name: string; password: string }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  login: async (data: { identifier: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Mandate APIs
export const mandateAPI = {
  create: async (data: { goal_name: string; percentage: number; target_amount: number; description?: string }) => {
    const response = await api.post('/mandates', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/mandates');
    return response.data;
  },
  update: async (id: string, status: string) => {
    const response = await api.put(`/mandates/${id}?status=${status}`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/mandates/${id}`);
    return response.data;
  },
};

// Transaction APIs
export const transactionAPI = {
  simulate: async (data: { amount: number; description: string; category?: string }) => {
    const response = await api.post('/transactions/simulate', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/transactions');
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  get: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },
};

export default api;
