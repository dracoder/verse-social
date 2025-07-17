import axios from 'axios';
import chatService from '../../services/chat';

const state = {
  chats: [],
  currentChat: null,
  messages: [],
  loading: false,
  error: null,
  unreadCount: 0,
  activeChannels: {}
};

const mutations = {
  SET_CHATS(state, chats) {
    state.chats = chats;
    state.unreadCount = chats.filter(chat => chat.unread_count > 0)
      .reduce((total, chat) => total + chat.unread_count, 0);
  },
  SET_CURRENT_CHAT(state, chat) {
    state.currentChat = chat;
  },
  SET_MESSAGES(state, messages) {
    state.messages = messages;
  },
  ADD_MESSAGE(state, message) {
    // Don't add duplicate messages
    if (!state.messages.some(m => m.id === message.id)) {
      state.messages.push(message);
    }
  },
  UPDATE_MESSAGE(state, updatedMessage) {
    const index = state.messages.findIndex(m => m.id === updatedMessage.id);
    if (index !== -1) {
      state.messages.splice(index, 1, updatedMessage);
    }
  },
  REMOVE_MESSAGE(state, messageId) {
    state.messages = state.messages.filter(m => m.id !== messageId);
  },
  ADD_CHAT(state, chat) {
    if (!state.chats.some(c => c.id === chat.id)) {
      state.chats.unshift(chat);
    }
  },
  UPDATE_CHAT(state, updatedChat) {
    const index = state.chats.findIndex(c => c.id === updatedChat.id);
    if (index !== -1) {
      state.chats.splice(index, 1, updatedChat);
      
      // Update unread count
      state.unreadCount = state.chats
        .filter(chat => chat.unread_count > 0)
        .reduce((total, chat) => total + chat.unread_count, 0);
    }
    
    // Also update current chat if it's the same
    if (state.currentChat && state.currentChat.id === updatedChat.id) {
      state.currentChat = updatedChat;
    }
  },
  MARK_CHAT_AS_READ(state, chatId) {
    const chat = state.chats.find(c => c.id === chatId);
    if (chat) {
      const oldUnreadCount = chat.unread_count || 0;
      chat.unread_count = 0;
      state.unreadCount = Math.max(0, state.unreadCount - oldUnreadCount);
    }
  },
  SET_ACTIVE_CHANNEL(state, { chatId, channel }) {
    state.activeChannels = {
      ...state.activeChannels,
      [chatId]: channel
    };
  },
  REMOVE_ACTIVE_CHANNEL(state, chatId) {
    const { [chatId]: removed, ...rest } = state.activeChannels;
    state.activeChannels = rest;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  }
};

const actions = {
  // Fetch all chats for the current user
  async fetchChats({ commit }) {
    commit('SET_LOADING', true);
    try {
      const response = await chatService.getChats();
      commit('SET_CHATS', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch chats');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Fetch a specific chat by ID
  async fetchChat({ commit }, chatId) {
    commit('SET_LOADING', true);
    try {
      const response = await chatService.getChat(chatId);
      commit('SET_CURRENT_CHAT', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch chat');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Fetch messages for a specific chat
  async fetchMessages({ commit }, { chatId, params }) {
    commit('SET_LOADING', true);
    try {
      const response = await chatService.getChatMessages(chatId, params);
      commit('SET_MESSAGES', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch messages');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Create a new private chat with a user
  async createPrivateChat({ commit }, userId) {
    commit('SET_LOADING', true);
    try {
      const response = await chatService.createPrivateChat(userId);
      commit('ADD_CHAT', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to create chat');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Create a new group chat
  async createGroupChat({ commit }, data) {
    commit('SET_LOADING', true);
    try {
      const response = await chatService.createGroupChat(data);
      commit('ADD_CHAT', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to create group chat');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Send a message to a chat
  async sendMessage({ commit }, data) {
    try {
      const response = await chatService.sendMessage(data);
      commit('ADD_MESSAGE', response.data);
      return response.data;
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to send message');
      throw error;
    }
  },
  
  // Delete a message
  async deleteMessage({ commit }, messageId) {
    try {
      await chatService.deleteMessage(messageId);
      commit('REMOVE_MESSAGE', messageId);
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Failed to delete message');
      throw error;
    }
  },
  
  // Mark a chat as read
  async markAsRead({ commit }, chatId) {
    try {
      await chatService.markAsRead(chatId);
      commit('MARK_CHAT_AS_READ', chatId);
    } catch (error) {
      console.error('Error marking chat as read:', error);
    }
  },
  
  // Subscribe to chat events
  subscribeToChat({ commit, rootGetters }, { chatId, chatType }) {
    // Unsubscribe from previous channel if exists
    this.dispatch('chat/unsubscribeFromChat', chatId);
    
    const channel = chatService.subscribeToChat(chatId, chatType, {
      onMessage: (data) => {
        commit('ADD_MESSAGE', data.message);
        
        // Update chat with latest message
        commit('UPDATE_CHAT', {
          ...data.chat,
          latest_message: data.message
        });
        
        // If this is not the current active chat, increment unread count
        if (!rootGetters['chat/isCurrentChat'](chatId)) {
          commit('UPDATE_CHAT', {
            id: chatId,
            unread_count: (data.chat.unread_count || 0) + 1
          });
        }
      },
      onTyping: (data) => {
        // Handle typing indicator in component
      },
      onRead: (data) => {
        // Update read status
        commit('UPDATE_CHAT', data.chat);
      }
    });
    
    commit('SET_ACTIVE_CHANNEL', { chatId, channel });
    return channel;
  },
  
  // Unsubscribe from chat events
  unsubscribeFromChat({ commit, state }, chatId) {
    const channel = state.activeChannels[chatId];
    if (channel) {
      channel.unsubscribe();
      commit('REMOVE_ACTIVE_CHANNEL', chatId);
    }
  },
  
  // Send typing indicator
  sendTypingIndicator({ state }, { chatId, isTyping }) {
    const channel = state.activeChannels[chatId];
    if (channel) {
      chatService.sendTypingIndicator(channel, isTyping);
    }
  },
  
  // Clear current chat
  clearCurrentChat({ commit }) {
    commit('SET_CURRENT_CHAT', null);
    commit('SET_MESSAGES', []);
  }
};

const getters = {
  allChats: state => state.chats,
  currentChat: state => state.currentChat,
  messages: state => state.messages,
  isLoading: state => state.loading,
  error: state => state.error,
  unreadCount: state => state.unreadCount,
  isCurrentChat: state => chatId => state.currentChat && state.currentChat.id === chatId,
  getChatById: state => chatId => state.chats.find(chat => chat.id === chatId),
  sortedChats: state => [...state.chats].sort((a, b) => {
    // Sort by latest message timestamp
    const aTime = a.latest_message?.created_at || a.updated_at || a.created_at;
    const bTime = b.latest_message?.created_at || b.updated_at || b.created_at;
    return new Date(bTime) - new Date(aTime);
  })
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};