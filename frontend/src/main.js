import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import axios from 'axios';
import './style.css';
import { initEcho } from './services/echo';

// Set base URL for API requests
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// Ensure API routes are correctly prefixed
const originalRequest = axios.request;
axios.request = function (config) {
  // Don't modify URLs that already have http:// or https://
  if (!config.url.startsWith('http://') && !config.url.startsWith('https://')) {
    // Add /api prefix if not already present
    if (!config.url.startsWith('/api/')) {
      config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }
  }
  return originalRequest.call(this, config);
};

// Add API request interceptor for debugging
axios.interceptors.request.use(config => {
  console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
  return config;
}, error => {
  console.error('API Request Error:', error);
  return Promise.reject(error);
});

// Add API response interceptor for debugging
axios.interceptors.response.use(response => {
  return response;
}, error => {
  console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
  return Promise.reject(error);
});

// Add auth token to requests if available
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  // Initialize Echo for real-time features
  initEcho(token);
}

// Create Vue app
const app = createApp(App);

// Make app instance available globally for Echo
window.app = app;

// Use router and store
app.use(router);
app.use(store);

// Mount app
app.mount('#app');

// Initialize app state
store.dispatch('initApp').catch(console.error);

// Check authentication status
if (token) {
  store.dispatch('auth/checkAuth').catch(() => {
    // Token is invalid, redirect to login
    router.push('/login');
  });
}
