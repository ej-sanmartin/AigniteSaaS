import axios from 'axios';
import Cookies from 'js-cookie';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${backendUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  // This ensures cookies are sent with requests
  withCredentials: true
});

// Add request interceptor to add Authorization header
api.interceptors.request.use(
  (config) => {
    try {
      // Get auth token from cookie
      const token = Cookies.get('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error setting Authorization header:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if we need to refresh the token
    // Either we get a 401 or the auth_token cookie is missing but refresh_token exists
    const needsRefresh = 
      (error.response?.status === 401 && !originalRequest._retry) ||
      (!Cookies.get('auth_token') && Cookies.get('refresh_token') && !originalRequest._retry);
    
    if (needsRefresh) {
      originalRequest._retry = true;

      try {
        console.log('Attempting to refresh token');
        // Try to refresh token using the refresh endpoint
        const { data } = await api.post('/auth/refresh');

        if (data.token) {
          console.log('Got new token from refresh');
          // Update auth token if returned
          Cookies.set('auth_token', data.token, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            expires: 1 // 1 day
          });
        }

        if (data.user) {
          console.log('Got user data from refresh');
          // Update the user cookie
          Cookies.set('user', typeof data.user === 'string' ? data.user : JSON.stringify(data.user), {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            expires: 1 // 1 day
          });
        }

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed', refreshError);
        // Don't use window.location.href which can cause cookie issues
        // Just remove user cookie - let the auth context handle the redirect
        Cookies.remove('user');
        // Don't remove auth_token here as it can cause flickering issues
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api; 