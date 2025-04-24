export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const API_BASE_URL = `${SERVER_URL}/api`;

export const ENDPOINTS = {
  REPAIR_REQUESTS: {
    UPDATE_STATUS: (id) => `${API_BASE_URL}/repair-requests/${id}/status`,
    LIST: `${API_BASE_URL}/repair-requests`,
    UNDER_REPAIR: `${API_BASE_URL}/under-repair`,
    UPDATE_UNDER_REPAIR: (id) => `${API_BASE_URL}/under-repair/${id}/status`,
  },
  NOTIFICATIONS: {
    CREATE: `${API_BASE_URL}/notifications`,
  },
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
  },
};

export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}; 