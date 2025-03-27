import axios from 'axios';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${backendUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Let the AuthContext handle the error
      error.code = 'AUTH_CHECK_FAILED';
    }
    return Promise.reject(error);
  }
);

export default api; 