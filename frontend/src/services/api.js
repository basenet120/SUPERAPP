import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
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
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password })
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
  bulkImport: (items) => api.post('/equipment/import', { items })
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
  getDashboardStats: () => api.get('/bookings/stats/dashboard')
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
  getUnread: () => api.get('/chat/unread')
};

// QuickBooks API
export const quickbooksAPI = {
  connect: () => api.get('/quickbooks/connect'),
  getStatus: () => api.get('/quickbooks/status'),
  syncCustomers: (realmId) => api.post('/quickbooks/sync/customers', { realmId }),
  syncPayments: (realmId) => api.post('/quickbooks/sync/payments', { realmId })
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
  removeRole: (id, roleId) => api.delete(`/auth/users/${id}/roles/${roleId}`)
};

export default api;
