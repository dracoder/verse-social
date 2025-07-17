import { createStore } from 'vuex';

// Import modules
import auth from './modules/auth';
import profile from './modules/profile';
import groups from './modules/groups';
import posts from './modules/posts';
import notifications from './modules/notifications';

// Create store
const store = createStore({
  modules: {
    auth,
    profile,
    groups,
    posts,
    notifications
  },
  // Global state
  state: {
    appLoading: false,
    darkMode: false,
    sidebarOpen: true
  },
  // Mutations
  mutations: {
    SET_LOADING(state, isLoading) {
      state.appLoading = isLoading;
    },
    TOGGLE_DARK_MODE(state) {
      state.darkMode = !state.darkMode;
      // Save preference to localStorage
      localStorage.setItem('darkMode', state.darkMode);
    },
    SET_DARK_MODE(state, isDark) {
      state.darkMode = isDark;
      // Save preference to localStorage
      localStorage.setItem('darkMode', state.darkMode);
    },
    TOGGLE_SIDEBAR(state) {
      state.sidebarOpen = !state.sidebarOpen;
    }
  },
  // Actions
  actions: {
    setLoading({ commit }, isLoading) {
      commit('SET_LOADING', isLoading);
    },
    toggleDarkMode({ commit }) {
      commit('TOGGLE_DARK_MODE');
    },
    setDarkMode({ commit }, isDark) {
      commit('SET_DARK_MODE', isDark);
    },
    toggleSidebar({ commit }) {
      commit('TOGGLE_SIDEBAR');
    },
    initApp({ commit }) {
      // Load dark mode preference from localStorage
      const darkMode = localStorage.getItem('darkMode') === 'true';
      commit('SET_DARK_MODE', darkMode);
    }
  },
  // Getters
  getters: {
    isLoading: state => state.appLoading,
    isDarkMode: state => state.darkMode,
    isSidebarOpen: state => state.sidebarOpen
  }
});

export default store;