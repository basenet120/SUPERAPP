import axios from 'axios';
import { QueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create Query Client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1, // Only retry once
      retryDelay: 2000, // Wait 2 seconds before retry
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Enable cookies for httpOnly JWT
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify/${token}`),
};

// Equipment API
export const equipmentAPI = {
  list: (params) => api.get('/equipment', { params }),
  getById: (id) => api.get(`/equipment/${id}`),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
  delete: (id) => api.delete(`/equipment/${id}`),
  checkAvailability: (id, startDate, endDate) => 
    api.get(`/equipment/${id}/availability`, { params: { startDate, endDate } }),
  getCategories: () => api.get('/equipment/categories'),
  getVendors: () => api.get('/equipment/vendors'),
  bulkImport: (items) => api.post('/equipment/import', { items }),
  uploadImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/equipment/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Booking API
export const bookingAPI = {
  list: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  updateStatus: (id, status, reason) => api.patch(`/bookings/${id}/status`, { status, reason }),
  delete: (id) => api.delete(`/bookings/${id}`),
  addItem: (id, item) => api.post(`/bookings/${id}/items`, item),
  updateItem: (itemId, data) => api.put(`/bookings/items/${itemId}`, data),
  removeItem: (itemId) => api.delete(`/bookings/items/${itemId}`),
  getHistory: (id) => api.get(`/bookings/${id}/history`),
  calculatePricing: (data) => api.post('/bookings/calculate-pricing', data),
  getDashboardStats: () => api.get('/bookings/stats/dashboard'),
  uploadCOI: (id, file) => {
    const formData = new FormData();
    formData.append('coi', file);
    return api.post(`/bookings/${id}/coi`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  signContract: (id, signature) => api.post(`/bookings/${id}/sign`, { signature }),
};

// Contacts API
export const contactsAPI = {
  list: (params) => api.get('/contacts', { params }),
  getById: (id) => api.get(`/contacts/${id}`),
  create: (data) => api.post('/contacts', data),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  delete: (id) => api.delete(`/contacts/${id}`),
  getActivities: (id) => api.get(`/contacts/${id}/activities`),
  addActivity: (id, data) => api.post(`/contacts/${id}/activities`, data),
  search: (query) => api.get('/contacts/search', { params: { q: query } }),
};

// Companies API
export const companiesAPI = {
  list: (params) => api.get('/companies', { params }),
  getById: (id) => api.get(`/companies/${id}`),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
  getContacts: (id) => api.get(`/companies/${id}/contacts`),
};

// Deals/Pipeline API
export const dealsAPI = {
  list: (params) => api.get('/deals', { params }),
  getById: (id) => api.get(`/deals/${id}`),
  create: (data) => api.post('/deals', data),
  update: (id, data) => api.put(`/deals/${id}`, data),
  updateStage: (id, stage) => api.patch(`/deals/${id}/stage`, { stage }),
  delete: (id) => api.delete(`/deals/${id}`),
  getPipeline: () => api.get('/deals/pipeline'),
};

// Chat API
export const chatAPI = {
  getChannels: () => api.get('/chat/channels'),
  createChannel: (data) => api.post('/chat/channels', data),
  getMessages: (channelId, params) => api.get(`/chat/channels/${channelId}/messages`, { params }),
  sendMessage: (channelId, data) => api.post(`/chat/channels/${channelId}/messages`, data),
  addReaction: (messageId, emoji) => api.post(`/chat/messages/${messageId}/reactions`, { emoji }),
  markAsRead: (channelId) => api.post(`/chat/channels/${channelId}/read`),
  search: (query, channelId) => api.get('/chat/search', { params: { q: query, channelId } }),
  getMembers: (channelId) => api.get(`/chat/channels/${channelId}/members`),
  joinChannel: (channelId) => api.post(`/chat/channels/${channelId}/join`),
  getUnread: () => api.get('/chat/unread'),
};

// QuickBooks API
export const quickbooksAPI = {
  connect: () => api.get('/quickbooks/connect'),
  getStatus: () => api.get('/quickbooks/status'),
  syncCustomers: (realmId) => api.post('/quickbooks/sync/customers', { realmId }),
  syncPayments: (realmId) => api.post('/quickbooks/sync/payments', { realmId }),
};

// User API
export const userAPI = {
  list: (params) => api.get('/auth/users', { params }),
  getById: (id) => api.get(`/auth/users/${id}`),
  create: (data) => api.post('/auth/users', data),
  update: (id, data) => api.put(`/auth/users/${id}`, data),
  delete: (id) => api.delete(`/auth/users/${id}`),
  getRoles: () => api.get('/auth/users/roles'),
  getPermissions: () => api.get('/auth/users/permissions'),
  assignRole: (id, roleId) => api.post(`/auth/users/${id}/roles`, { roleId }),
  removeRole: (id, roleId) => api.delete(`/auth/users/${id}/roles/${roleId}`),
};

// Activity/Notifications API
export const activityAPI = {
  getRecent: (params) => api.get('/activity', { params }),
  getUnread: () => api.get('/activity/unread'),
  markAsRead: (id) => api.post(`/activity/${id}/read`),
  markAllAsRead: () => api.post('/activity/read-all'),
};

export { api };
export default api;
