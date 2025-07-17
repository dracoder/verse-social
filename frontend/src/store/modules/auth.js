import axios from 'axios';

const state = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  loading: false,
  error: null
};

const mutations = {
  AUTH_REQUEST(state) {
    state.loading = true;
    state.error = null;
  },
  AUTH_SUCCESS(state, { token, user }) {
    state.token = token;
    state.user = user;
    state.loading = false;
    state.error = null;
  },
  AUTH_ERROR(state, error) {
    state.loading = false;
    state.error = error;
  },
  LOGOUT(state) {
    state.token = null;
    state.user = null;
  },
  UPDATE_USER(state, user) {
    state.user = { ...state.user, ...user };
    localStorage.setItem('user', JSON.stringify(state.user));
  }
};

const actions = {
  // Login action
  async login({ commit }, credentials) {
    commit('AUTH_REQUEST');
    try {
      // Send login request to API
      const response = await axios.post('/login', credentials);
      
      // Get token and user data from response
      const { token, user } = response.data;
      
      // Store token in localStorage and axios default headers
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      // Commit success mutation
      commit('AUTH_SUCCESS', { token, user });
      
      return response;
    } catch (error) {
      commit('AUTH_ERROR', error.response?.data?.message || 'Authentication failed');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw error;
    }
  },
  
  // Register action
  async register({ commit }, userData) {
    commit('AUTH_REQUEST');
    try {
      // Send register request to API
      const response = await axios.post('/register', userData);
      
      // Get token and user data from response
      const { token, user } = response.data;
      
      // Store token in localStorage and axios default headers
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      // Commit success mutation
      commit('AUTH_SUCCESS', { token, user });
      
      return response;
    } catch (error) {
      commit('AUTH_ERROR', error.response?.data?.message || 'Registration failed');
      throw error;
    }
  },
  
  // Logout action
  logout({ commit }) {
    return new Promise((resolve) => {
      // Remove token from localStorage and axios headers
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      
      // Commit logout mutation
      commit('LOGOUT');
      
      resolve();
    });
  },
  
  // Check if token is valid and refresh user data
  async checkAuth({ commit, state }) {
    if (!state.token) {
      return Promise.reject(new Error('No token found'));
    }
    
    commit('AUTH_REQUEST');
    try {
      // Set token in axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
      
      // Get current user data
      const response = await axios.get('/user');
      const user = response.data;
      
      // Update user data in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      // Commit success mutation
      commit('AUTH_SUCCESS', { token: state.token, user });
      
      return response;
    } catch (error) {
      commit('AUTH_ERROR', error.response?.data?.message || 'Authentication failed');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
      throw error;
    }
  },
  
  // Update user profile
  updateUser({ commit }, userData) {
    commit('UPDATE_USER', userData);
  }
};

const getters = {
  isAuthenticated: state => !!state.token,
  currentUser: state => state.user,
  authLoading: state => state.loading,
  authError: state => state.error,
  userId: state => state.user?.id
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};