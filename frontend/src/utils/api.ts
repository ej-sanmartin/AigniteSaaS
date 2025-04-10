import axios from 'axios';

// Create axios instance with default config with interceptors.
export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance with default config without interceptors.
export const bypassInterceptorsApi = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track failed attempts for exponential backoff.
let failedAttempts = 0;
let lastFailedAttempt = 0;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF = 1000; // 1 second

// Calculate backoff time
const getBackoffTime = () => {
  const now = Date.now();
  const timeSinceLastAttempt = now - lastFailedAttempt;
  const backoffTime = Math.min(INITIAL_BACKOFF * Math.pow(2, failedAttempts), 30000); // Max 30 seconds
  
  // Reset if it's been more than 5 minutes since last attempt
  if (timeSinceLastAttempt > 5 * 60 * 1000) {
    failedAttempts = 0;
    return INITIAL_BACKOFF;
  }
  
  return backoffTime;
};

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // Add CSRF token to headers if it exists
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_token='))
      ?.split('=')[1];
    
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = decodeURIComponent(csrfToken);
    } else {
      console.warn('CSRF token not found in cookies');
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    // Reset failed attempts on successful response
    failedAttempts = 0;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle rate limit errors with exponential backoff
    if (error.response?.status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (failedAttempts < MAX_RETRIES) {
        failedAttempts++;
        lastFailedAttempt = Date.now();
        
        const backoffTime = getBackoffTime();
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        
        return api(originalRequest);
      }
    }

    // Handle session expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the session
        await api.post('/auth/refresh');
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
