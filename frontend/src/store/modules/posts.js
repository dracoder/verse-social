import axios from 'axios';

const state = {
  posts: [],
  groupPosts: {},
  userPosts: {},
  currentPost: null,
  loading: false,
  error: null,
  postsPagination: {
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0
  }
};

const mutations = {
  SET_POSTS(state, posts) {
    state.posts = posts;
  },
  SET_GROUP_POSTS(state, { groupId, posts }) {
    state.groupPosts = {
      ...state.groupPosts,
      [groupId]: posts
    };
  },
  SET_USER_POSTS(state, { userId, posts }) {
    state.userPosts = {
      ...state.userPosts,
      [userId]: posts
    };
  },
  SET_CURRENT_POST(state, post) {
    state.currentPost = post;
  },
  ADD_POST(state, post) {
    // Add to beginning of feed
    state.posts.unshift(post);
    
    // Add to group posts if applicable
    if (post.group_id && state.groupPosts[post.group_id]) {
      state.groupPosts[post.group_id].unshift(post);
    }
    
    // Add to user posts if applicable
    if (post.user_id && state.userPosts[post.user_id]) {
      state.userPosts[post.user_id].unshift(post);
    }
  },
  UPDATE_POST(state, updatedPost) {
    // Update in main posts array
    const postIndex = state.posts.findIndex(post => post.id === updatedPost.id);
    if (postIndex !== -1) {
      state.posts.splice(postIndex, 1, updatedPost);
    }
    
    // Update in group posts if applicable
    if (updatedPost.group_id && state.groupPosts[updatedPost.group_id]) {
      const groupPostIndex = state.groupPosts[updatedPost.group_id].findIndex(post => post.id === updatedPost.id);
      if (groupPostIndex !== -1) {
        state.groupPosts[updatedPost.group_id].splice(groupPostIndex, 1, updatedPost);
      }
    }
    
    // Update in user posts if applicable
    if (updatedPost.user_id && state.userPosts[updatedPost.user_id]) {
      const userPostIndex = state.userPosts[updatedPost.user_id].findIndex(post => post.id === updatedPost.id);
      if (userPostIndex !== -1) {
        state.userPosts[updatedPost.user_id].splice(userPostIndex, 1, updatedPost);
      }
    }
    
    // Update current post if applicable
    if (state.currentPost && state.currentPost.id === updatedPost.id) {
      state.currentPost = updatedPost;
    }
  },
  REMOVE_POST(state, postId) {
    // Find the post to get its group_id and user_id before removing
    const post = state.posts.find(p => p.id === postId);
    
    // Remove from main posts array
    state.posts = state.posts.filter(post => post.id !== postId);
    
    // Remove from group posts if applicable
    if (post && post.group_id && state.groupPosts[post.group_id]) {
      state.groupPosts[post.group_id] = state.groupPosts[post.group_id].filter(p => p.id !== postId);
    }
    
    // Remove from user posts if applicable
    if (post && post.user_id && state.userPosts[post.user_id]) {
      state.userPosts[post.user_id] = state.userPosts[post.user_id].filter(p => p.id !== postId);
    }
    
    // Clear current post if applicable
    if (state.currentPost && state.currentPost.id === postId) {
      state.currentPost = null;
    }
  },
  ADD_COMMENT(state, { postId, comment }) {
    // Add comment to post in main posts array
    const post = state.posts.find(p => p.id === postId);
    if (post) {
      if (!post.comments) {
        post.comments = [];
      }
      post.comments.push(comment);
      post.comments_count = (post.comments_count || 0) + 1;
    }
    
    // Add comment to post in group posts if applicable
    if (post && post.group_id && state.groupPosts[post.group_id]) {
      const groupPost = state.groupPosts[post.group_id].find(p => p.id === postId);
      if (groupPost) {
        if (!groupPost.comments) {
          groupPost.comments = [];
        }
        groupPost.comments.push(comment);
        groupPost.comments_count = (groupPost.comments_count || 0) + 1;
      }
    }
    
    // Add comment to post in user posts if applicable
    if (post && post.user_id && state.userPosts[post.user_id]) {
      const userPost = state.userPosts[post.user_id].find(p => p.id === postId);
      if (userPost) {
        if (!userPost.comments) {
          userPost.comments = [];
        }
        userPost.comments.push(comment);
        userPost.comments_count = (userPost.comments_count || 0) + 1;
      }
    }
    
    // Add comment to current post if applicable
    if (state.currentPost && state.currentPost.id === postId) {
      if (!state.currentPost.comments) {
        state.currentPost.comments = [];
      }
      state.currentPost.comments.push(comment);
      state.currentPost.comments_count = (state.currentPost.comments_count || 0) + 1;
    }
  },
  TOGGLE_LIKE(state, { postId, userId, liked }) {
    // Update like status in main posts array
    const post = state.posts.find(p => p.id === postId);
    if (post) {
      if (liked) {
        post.likes_count = (post.likes_count || 0) + 1;
        if (!post.liked_by_user) {
          post.liked_by_user = true;
        }
      } else {
        post.likes_count = Math.max((post.likes_count || 0) - 1, 0);
        post.liked_by_user = false;
      }
    }
    
    // Update like status in group posts if applicable
    if (post && post.group_id && state.groupPosts[post.group_id]) {
      const groupPost = state.groupPosts[post.group_id].find(p => p.id === postId);
      if (groupPost) {
        if (liked) {
          groupPost.likes_count = (groupPost.likes_count || 0) + 1;
          if (!groupPost.liked_by_user) {
            groupPost.liked_by_user = true;
          }
        } else {
          groupPost.likes_count = Math.max((groupPost.likes_count || 0) - 1, 0);
          groupPost.liked_by_user = false;
        }
      }
    }
    
    // Update like status in user posts if applicable
    if (post && post.user_id && state.userPosts[post.user_id]) {
      const userPost = state.userPosts[post.user_id].find(p => p.id === postId);
      if (userPost) {
        if (liked) {
          userPost.likes_count = (userPost.likes_count || 0) + 1;
          if (!userPost.liked_by_user) {
            userPost.liked_by_user = true;
          }
        } else {
          userPost.likes_count = Math.max((userPost.likes_count || 0) - 1, 0);
          userPost.liked_by_user = false;
        }
      }
    }
    
    // Update like status in current post if applicable
    if (state.currentPost && state.currentPost.id === postId) {
      if (liked) {
        state.currentPost.likes_count = (state.currentPost.likes_count || 0) + 1;
        if (!state.currentPost.liked_by_user) {
          state.currentPost.liked_by_user = true;
        }
      } else {
        state.currentPost.likes_count = Math.max((state.currentPost.likes_count || 0) - 1, 0);
        state.currentPost.liked_by_user = false;
      }
    }
  },
  SET_PAGINATION(state, pagination) {
    state.postsPagination = pagination;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  }
};

const actions = {
  // Fetch feed posts
  async fetchFeed({ commit }, page = 1) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get('/api/feed', {
        params: { page }
      });
      
      commit('SET_POSTS', response.data.data);
      commit('SET_PAGINATION', {
        currentPage: response.data.current_page,
        lastPage: response.data.last_page,
        perPage: response.data.per_page,
        total: response.data.total
      });
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch feed');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Fetch group posts
  async fetchGroupPosts({ commit }, { groupId, page = 1 }) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get(`/api/groups/${groupId}/posts`, {
        params: { page }
      });
      
      commit('SET_GROUP_POSTS', { 
        groupId, 
        posts: response.data.data 
      });
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch group posts');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Fetch user posts
  async fetchUserPosts({ commit }, { userId, page = 1 }) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get(`/api/users/${userId}/posts`, {
        params: { page }
      });
      
      commit('SET_USER_POSTS', { 
        userId, 
        posts: response.data.data 
      });
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch user posts');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Fetch single post
  async fetchPost({ commit }, postId) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.get(`/api/posts/${postId}`);
      commit('SET_CURRENT_POST', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch post');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Create a new post
  async createPost({ commit }, postData) {
    commit('SET_LOADING', true);
    try {
      // Handle FormData for file uploads
      let data;
      if (postData instanceof FormData) {
        data = postData;
      } else {
        data = new FormData();
        Object.keys(postData).forEach(key => {
          if (key === 'media' && Array.isArray(postData.media)) {
            postData.media.forEach(file => {
              data.append('media[]', file);
            });
          } else {
            data.append(key, postData[key]);
          }
        });
      }
      
      const response = await axios.post('/api/posts', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      commit('ADD_POST', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to create post');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Update a post
  async updatePost({ commit }, { postId, postData }) {
    commit('SET_LOADING', true);
    try {
      // Handle FormData for file uploads
      let data;
      if (postData instanceof FormData) {
        data = postData;
      } else {
        data = new FormData();
        Object.keys(postData).forEach(key => {
          if (key === 'media' && Array.isArray(postData.media)) {
            postData.media.forEach(file => {
              data.append('media[]', file);
            });
          } else {
            data.append(key, postData[key]);
          }
        });
      }
      
      const response = await axios.post(`/api/posts/${postId}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      commit('UPDATE_POST', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to update post');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Delete a post
  async deletePost({ commit }, postId) {
    commit('SET_LOADING', true);
    try {
      await axios.delete(`/api/posts/${postId}`);
      commit('REMOVE_POST', postId);
      return true;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to delete post');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Add a comment to a post
  async addComment({ commit }, { postId, content, parentId = null }) {
    try {
      const response = await axios.post(`/api/posts/${postId}/comments`, {
        content,
        parent_id: parentId
      });
      
      commit('ADD_COMMENT', { postId, comment: response.data });
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to add comment');
      throw error;
    }
  },
  
  // Toggle like on a post
  async toggleLike({ commit, rootGetters }, postId) {
    try {
      const userId = rootGetters['auth/userId'];
      const response = await axios.post(`/api/posts/${postId}/like`);
      
      commit('TOGGLE_LIKE', { 
        postId, 
        userId, 
        liked: response.data.liked 
      });
      
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to toggle like');
      throw error;
    }
  },
  
  // Handle real-time post update
  receivePost({ commit }, post) {
    commit('ADD_POST', post);
  },
  
  // Handle real-time post update
  receivePostUpdate({ commit }, post) {
    commit('UPDATE_POST', post);
  },
  
  // Handle real-time post deletion
  receivePostDelete({ commit }, postId) {
    commit('REMOVE_POST', postId);
  },
  
  // Handle real-time comment
  receiveComment({ commit }, { postId, comment }) {
    commit('ADD_COMMENT', { postId, comment });
  },
  
  // Handle real-time like
  receiveLike({ commit }, { postId, userId, liked }) {
    commit('TOGGLE_LIKE', { postId, userId, liked });
  }
};

const getters = {
  allPosts: state => state.posts,
  groupPosts: state => groupId => state.groupPosts[groupId] || [],
  userPosts: state => userId => state.userPosts[userId] || [],
  currentPost: state => state.currentPost,
  isLoading: state => state.loading,
  error: state => state.error,
  pagination: state => state.postsPagination
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};