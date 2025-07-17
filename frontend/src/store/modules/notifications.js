import axios from 'axios';

const state = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null
};

const mutations = {
  SET_NOTIFICATIONS(state, notifications) {
    state.notifications = notifications;
    state.unreadCount = notifications.filter(notification => !notification.read_at).length;
  },
  ADD_NOTIFICATION(state, notification) {
    // Add to beginning of array
    state.notifications.unshift(notification);
    if (!notification.read_at) {
      state.unreadCount++;
    }
  },
  MARK_AS_READ(state, notificationId) {
    const notification = state.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read_at) {
      notification.read_at = new Date();
      state.unreadCount--;
    }
  },
  MARK_ALL_AS_READ(state) {
    state.notifications.forEach(notification => {
      if (!notification.read_at) {
        notification.read_at = new Date();
      }
    });
    state.unreadCount = 0;
  },
  REMOVE_NOTIFICATION(state, notificationId) {
    const index = state.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      const notification = state.notifications[index];
      if (!notification.read_at) {
        state.unreadCount--;
      }
      state.notifications.splice(index, 1);
    }
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  }
};

const actions = {
  // Fetch all notifications
  async fetchNotifications({ commit }) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get('/api/notifications');
      commit('SET_NOTIFICATIONS', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch notifications');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Mark a notification as read
  async markAsRead({ commit }, notificationId) {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      commit('MARK_AS_READ', notificationId);
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to mark notification as read');
      throw error;
    }
  },
  
  // Mark all notifications as read
  async markAllAsRead({ commit }) {
    try {
      await axios.put('/api/notifications/read-all');
      commit('MARK_ALL_AS_READ');
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to mark all notifications as read');
      throw error;
    }
  },
  
  // Delete a notification
  async deleteNotification({ commit }, notificationId) {
    try {
      await axios.delete(`/api/notifications/${notificationId}`);
      commit('REMOVE_NOTIFICATION', notificationId);
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to delete notification');
      throw error;
    }
  },
  
  // Handle real-time notification
  receiveNotification({ commit }, notification) {
    commit('ADD_NOTIFICATION', notification);
  }
};

const getters = {
  allNotifications: state => state.notifications,
  unreadNotifications: state => state.notifications.filter(notification => !notification.read_at),
  unreadCount: state => state.unreadCount,
  isLoading: state => state.loading,
  error: state => state.error
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};