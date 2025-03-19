import axios from 'axios';
import { getCookie } from 'cookies-next';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Important for cookies
});

// Add request interceptor for auth token
api.interceptors.request.use((config) => {
  // Ensure token is not exposed to window object
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on auth errors
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 