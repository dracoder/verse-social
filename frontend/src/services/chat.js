import axios from 'axios';
import { subscribeToChannel } from './echo';

/**
 * Chat service for handling chat-related operations
 */
export default {
  /**
   * Get all chats for the current user
   * @returns {Promise} Promise object representing the API call
   */
  getChats() {
    return axios.get('/api/chats');
  },

  /**
   * Get a specific chat by ID
   * @param {string|number} chatId - The chat ID
   * @returns {Promise} Promise object representing the API call
   */
  getChat(chatId) {
    return axios.get(`/api/chats/${chatId}`);
  },

  /**
   * Get messages for a specific chat
   * @param {string|number} chatId - The chat ID
   * @param {Object} params - Query parameters (page, limit, etc.)
   * @returns {Promise} Promise object representing the API call
   */
  getChatMessages(chatId, params = {}) {
    return axios.get(`/api/chats/${chatId}/messages`, { params });
  },

  /**
   * Create a new private chat with a user
   * @param {string|number} userId - The user ID to chat with
   * @returns {Promise} Promise object representing the API call
   */
  createPrivateChat(userId) {
    return axios.post('/api/chats', {
      type: 'private',
      user_id: userId
    });
  },

  /**
   * Create a new group chat
   * @param {Object} data - Group chat data
   * @param {string} data.name - Group chat name
   * @param {Array} data.user_ids - Array of user IDs to add to the group
   * @returns {Promise} Promise object representing the API call
   */
  createGroupChat(data) {
    return axios.post('/api/chats', {
      type: 'group',
      name: data.name,
      user_ids: data.user_ids
    });
  },

  /**
   * Send a message to a chat
   * @param {Object} data - Message data
   * @param {string|number} data.chat_id - The chat ID
   * @param {string} data.content - Message content
   * @param {Array} data.attachments - Optional attachments
   * @returns {Promise} Promise object representing the API call
   */
  sendMessage(data) {
    const formData = new FormData();
    formData.append('chat_id', data.chat_id);
    formData.append('content', data.content);
    
    // Add attachments if any
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file, index) => {
        formData.append(`attachments[${index}]`, file);
      });
    }
    
    return axios.post('/api/messages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  /**
   * Delete a message
   * @param {string|number} messageId - The message ID
   * @returns {Promise} Promise object representing the API call
   */
  deleteMessage(messageId) {
    return axios.delete(`/api/messages/${messageId}`);
  },

  /**
   * Mark a chat as read
   * @param {string|number} chatId - The chat ID
   * @returns {Promise} Promise object representing the API call
   */
  markAsRead(chatId) {
    return axios.put(`/api/chats/${chatId}/read`);
  },

  /**
   * Add users to a group chat
   * @param {string|number} chatId - The chat ID
   * @param {Array} userIds - Array of user IDs to add
   * @returns {Promise} Promise object representing the API call
   */
  addUsersToGroup(chatId, userIds) {
    return axios.post(`/api/chats/${chatId}/users`, {
      user_ids: userIds
    });
  },

  /**
   * Remove a user from a group chat
   * @param {string|number} chatId - The chat ID
   * @param {string|number} userId - The user ID to remove
   * @returns {Promise} Promise object representing the API call
   */
  removeUserFromGroup(chatId, userId) {
    return axios.delete(`/api/chats/${chatId}/users/${userId}`);
  },

  /**
   * Leave a group chat
   * @param {string|number} chatId - The chat ID
   * @returns {Promise} Promise object representing the API call
   */
  leaveGroup(chatId) {
    return axios.delete(`/api/chats/${chatId}/leave`);
  },

  /**
   * Update group chat details
   * @param {string|number} chatId - The chat ID
   * @param {Object} data - Updated chat data
   * @returns {Promise} Promise object representing the API call
   */
  updateGroupChat(chatId, data) {
    return axios.put(`/api/chats/${chatId}`, data);
  },

  /**
   * Subscribe to chat events
   * @param {string|number} chatId - The chat ID
   * @param {string} chatType - The chat type ('private', 'group')
   * @param {Function} onMessage - Callback for new messages
   * @param {Function} onTyping - Callback for typing indicators
   * @param {Function} onRead - Callback for read receipts
   * @returns {Object} Echo channel object
   */
  subscribeToChat(chatId, chatType, { onMessage, onTyping, onRead }) {
    const channelName = chatType === 'private' 
      ? `private-chat.${chatId}` 
      : `group-chat.${chatId}`;
    
    const channel = subscribeToChannel(channelName);
    
    if (onMessage) {
      channel.listen('.message.created', onMessage);
    }
    
    if (onTyping) {
      channel.listenForWhisper('typing', onTyping);
    }
    
    if (onRead) {
      channel.listen('.chat.read', onRead);
    }
    
    return channel;
  },

  /**
   * Send typing indicator
   * @param {Object} channel - Echo channel object
   * @param {boolean} isTyping - Whether the user is typing
   */
  sendTypingIndicator(channel, isTyping) {
    if (!channel) return;
    
    channel.whisper('typing', {
      isTyping
    });
  }
}