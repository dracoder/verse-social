import axios from 'axios';

const state = {
  groups: [],
  myGroups: [],
  currentGroup: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0
  }
};

const mutations = {
  SET_GROUPS(state, groups) {
    state.groups = groups;
  },
  SET_MY_GROUPS(state, groups) {
    state.myGroups = groups;
  },
  SET_CURRENT_GROUP(state, group) {
    state.currentGroup = group;
  },
  ADD_GROUP(state, group) {
    state.groups.unshift(group);
    state.myGroups.unshift(group);
  },
  UPDATE_GROUP(state, updatedGroup) {
    // Update in groups array
    const groupIndex = state.groups.findIndex(group => group.id === updatedGroup.id);
    if (groupIndex !== -1) {
      state.groups.splice(groupIndex, 1, updatedGroup);
    }
    
    // Update in myGroups array
    const myGroupIndex = state.myGroups.findIndex(group => group.id === updatedGroup.id);
    if (myGroupIndex !== -1) {
      state.myGroups.splice(myGroupIndex, 1, updatedGroup);
    }
    
    // Update currentGroup if applicable
    if (state.currentGroup && state.currentGroup.id === updatedGroup.id) {
      state.currentGroup = updatedGroup;
    }
  },
  REMOVE_GROUP(state, groupId) {
    state.groups = state.groups.filter(group => group.id !== groupId);
    state.myGroups = state.myGroups.filter(group => group.id !== groupId);
    
    // Clear currentGroup if applicable
    if (state.currentGroup && state.currentGroup.id === groupId) {
      state.currentGroup = null;
    }
  },
  ADD_MEMBER(state, { groupId, member }) {
    // Add member to currentGroup if applicable
    if (state.currentGroup && state.currentGroup.id === groupId) {
      if (!state.currentGroup.members) {
        state.currentGroup.members = [];
      }
      state.currentGroup.members.push(member);
    }
    
    // Update member count in groups array
    const group = state.groups.find(g => g.id === groupId);
    if (group) {
      group.members_count = (group.members_count || 0) + 1;
    }
    
    // Update member count in myGroups array
    const myGroup = state.myGroups.find(g => g.id === groupId);
    if (myGroup) {
      myGroup.members_count = (myGroup.members_count || 0) + 1;
    }
  },
  REMOVE_MEMBER(state, { groupId, memberId }) {
    // Remove member from currentGroup if applicable
    if (state.currentGroup && state.currentGroup.id === groupId && state.currentGroup.members) {
      state.currentGroup.members = state.currentGroup.members.filter(member => member.id !== memberId);
    }
    
    // Update member count in groups array
    const group = state.groups.find(g => g.id === groupId);
    if (group) {
      group.members_count = Math.max((group.members_count || 0) - 1, 0);
    }
    
    // Update member count in myGroups array
    const myGroup = state.myGroups.find(g => g.id === groupId);
    if (myGroup) {
      myGroup.members_count = Math.max((myGroup.members_count || 0) - 1, 0);
    }
  },
  UPDATE_MEMBER_ROLE(state, { groupId, memberId, role }) {
    // Update member role in currentGroup if applicable
    if (state.currentGroup && state.currentGroup.id === groupId && state.currentGroup.members) {
      const member = state.currentGroup.members.find(m => m.id === memberId);
      if (member && member.pivot) {
        member.pivot.role = role;
      }
    }
  },
  SET_PAGINATION(state, pagination) {
    state.pagination = pagination;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  }
};

const actions = {
  // Fetch all groups
  async fetchGroups({ commit }, { page = 1, search = '', privacy = '' }) {
    commit('SET_LOADING', true);
    try {
      const params = { page };
      if (search) params.search = search;
      if (privacy) params.privacy_type = privacy;
      
      const response = await axios.get('/api/groups', { params });
      
      commit('SET_GROUPS', response.data.data);
      commit('SET_PAGINATION', {
        currentPage: response.data.current_page,
        lastPage: response.data.last_page,
        perPage: response.data.per_page,
        total: response.data.total
      });
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch groups');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Fetch user's groups
  async fetchMyGroups({ commit }) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get('/api/groups/my');
      commit('SET_MY_GROUPS', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch your groups');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Fetch a single group
  async fetchGroup({ commit }, slug) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get(`/api/groups/${slug}`);
      commit('SET_CURRENT_GROUP', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch group');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Create a new group
  async createGroup({ commit }, groupData) {
    commit('SET_LOADING', true);
    try {
      // Handle FormData for file uploads
      let data;
      if (groupData instanceof FormData) {
        data = groupData;
      } else {
        data = new FormData();
        Object.keys(groupData).forEach(key => {
          if (key === 'avatar' || key === 'cover_image') {
            if (groupData[key]) {
              data.append(key, groupData[key]);
            }
          } else {
            data.append(key, groupData[key]);
          }
        });
      }
      
      const response = await axios.post('/api/groups', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      commit('ADD_GROUP', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to create group');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Update a group
  async updateGroup({ commit }, { groupId, groupData }) {
    commit('SET_LOADING', true);
    try {
      // Handle FormData for file uploads
      let data;
      if (groupData instanceof FormData) {
        data = groupData;
      } else {
        data = new FormData();
        Object.keys(groupData).forEach(key => {
          if (key === 'avatar' || key === 'cover_image') {
            if (groupData[key]) {
              data.append(key, groupData[key]);
            }
          } else {
            data.append(key, groupData[key]);
          }
        });
      }
      
      const response = await axios.put(`/api/groups/${groupId}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      commit('UPDATE_GROUP', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to update group');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Delete a group
  async deleteGroup({ commit }, groupId) {
    commit('SET_LOADING', true);
    try {
      await axios.delete(`/api/groups/${groupId}`);
      commit('REMOVE_GROUP', groupId);
      return true;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to delete group');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Join a group
  async joinGroup({ commit, rootGetters }, groupId) {
    try {
      const userId = rootGetters['auth/userId'];
      const response = await axios.post(`/api/groups/${groupId}/members`, {
        user_id: userId,
        role: 'member'
      });
      
      commit('ADD_MEMBER', { 
        groupId, 
        member: {
          id: userId,
          ...rootGetters['auth/currentUser'],
          pivot: { role: 'member' }
        }
      });
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to join group');
      throw error;
    }
  },
  
  // Leave a group
  async leaveGroup({ commit, rootGetters }, groupId) {
    try {
      const userId = rootGetters['auth/userId'];
      await axios.delete(`/api/groups/${groupId}/members/${userId}`);
      
      commit('REMOVE_MEMBER', { groupId, memberId: userId });
      return true;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to leave group');
      throw error;
    }
  },
  
  // Add a member to a group
  async addMember({ commit }, { groupId, userId, role = 'member' }) {
    try {
      const response = await axios.post(`/api/groups/${groupId}/members`, {
        user_id: userId,
        role
      });
      
      commit('ADD_MEMBER', { 
        groupId, 
        member: response.data
      });
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to add member');
      throw error;
    }
  },
  
  // Remove a member from a group
  async removeMember({ commit }, { groupId, memberId }) {
    try {
      await axios.delete(`/api/groups/${groupId}/members/${memberId}`);
      
      commit('REMOVE_MEMBER', { groupId, memberId });
      return true;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to remove member');
      throw error;
    }
  },
  
  // Update a member's role
  async updateMemberRole({ commit }, { groupId, memberId, role }) {
    try {
      await axios.put(`/api/groups/${groupId}/members/${memberId}`, { role });
      
      commit('UPDATE_MEMBER_ROLE', { groupId, memberId, role });
      return true;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to update member role');
      throw error;
    }
  },
  
  // Handle real-time group update
  receiveGroupUpdate({ commit }, group) {
    commit('UPDATE_GROUP', group);
  },
  
  // Handle real-time member addition
  receiveMemberAdded({ commit }, { groupId, member }) {
    commit('ADD_MEMBER', { groupId, member });
  },
  
  // Handle real-time member removal
  receiveMemberRemoved({ commit }, { groupId, memberId }) {
    commit('REMOVE_MEMBER', { groupId, memberId });
  },
  
  // Handle real-time member role update
  receiveMemberRoleUpdated({ commit }, { groupId, memberId, role }) {
    commit('UPDATE_MEMBER_ROLE', { groupId, memberId, role });
  }
};

const getters = {
  allGroups: state => state.groups,
  myGroups: state => state.myGroups,
  currentGroup: state => state.currentGroup,
  isLoading: state => state.loading,
  error: state => state.error,
  pagination: state => state.pagination
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};