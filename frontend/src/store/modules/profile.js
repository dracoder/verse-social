import axios from 'axios';

const state = {
  profile: null,
  userProfiles: {},
  loading: false,
  error: null
};

const mutations = {
  SET_PROFILE(state, profile) {
    state.profile = profile;
  },
  SET_USER_PROFILE(state, { userId, profile }) {
    state.userProfiles = {
      ...state.userProfiles,
      [userId]: profile
    };
  },
  UPDATE_PROFILE(state, updatedProfile) {
    state.profile = { ...state.profile, ...updatedProfile };
    
    // Also update in userProfiles if exists
    if (updatedProfile.user_id && state.userProfiles[updatedProfile.user_id]) {
      state.userProfiles[updatedProfile.user_id] = { 
        ...state.userProfiles[updatedProfile.user_id], 
        ...updatedProfile 
      };
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
  // Fetch current user's profile
  async fetchProfile({ commit }) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get('/api/profile');
      commit('SET_PROFILE', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch profile');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Fetch another user's profile
  async fetchUserProfile({ commit }, userId) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get(`/api/profile/${userId}`);
      commit('SET_USER_PROFILE', { userId, profile: response.data });
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch user profile');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Update current user's profile
  async updateProfile({ commit }, profileData) {
    commit('SET_LOADING', true);
    try {
      // Handle FormData for file uploads
      let data;
      if (profileData instanceof FormData) {
        data = profileData;
      } else {
        data = new FormData();
        Object.keys(profileData).forEach(key => {
          if (key === 'avatar' || key === 'background_image') {
            if (profileData[key]) {
              data.append(key, profileData[key]);
            }
          } else if (key === 'social_links' || key === 'privacy_settings') {
            data.append(key, JSON.stringify(profileData[key]));
          } else {
            data.append(key, profileData[key]);
          }
        });
      }
      
      const response = await axios.put('/api/profile', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      commit('UPDATE_PROFILE', response.data);
      
      // Also update user data in auth module if display_name changed
      if (profileData.display_name) {
        commit('auth/UPDATE_USER', { name: profileData.display_name }, { root: true });
      }
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to update profile');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Handle real-time profile update
  receiveProfileUpdate({ commit }, profile) {
    commit('UPDATE_PROFILE', profile);
  }
};

const getters = {
  userProfile: state => state.profile,
  getUserProfile: state => userId => state.userProfiles[userId] || null,
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