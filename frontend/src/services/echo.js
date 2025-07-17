import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

// Initialize Pusher and Laravel Echo
let echo = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

/**
 * Initialize Laravel Echo for real-time events
 * @param {string} token - The authentication token
 * @returns {Echo|null} The Echo instance or null if initialization failed
 */
export const initEcho = (token) => {
  if (!token) {
    console.error('Cannot initialize Echo: No authentication token provided');
    return null;
  }

  try {
    // Make Pusher available globally
    window.Pusher = Pusher;
    
    // Configure Pusher logging
    Pusher.logToConsole = import.meta.env.DEV || false;
    
    // Create Echo instance
    echo = new Echo({
      broadcaster: 'pusher',
      key: import.meta.env.VITE_PUSHER_APP_KEY,
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
      forceTLS: true,
      encrypted: true,
      authEndpoint: `${axios.defaults.baseURL}/api/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      },
      authorizer: (channel, options) => {
        return {
          authorize: (socketId, callback) => {
            axios.post(`${axios.defaults.baseURL}/api/broadcasting/auth`, {
              socket_id: socketId,
              channel_name: channel.name
            }, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })
            .then(response => {
              callback(false, response.data);
            })
            .catch(error => {
              console.error('Echo authorization error:', error);
              callback(true, error);
            });
          }
        };
      }
    });
    
    // Setup connection event handlers
    setupConnectionEventHandlers();
    
    return echo;
  } catch (error) {
    console.error('Failed to initialize Echo:', error);
    return null;
  }
};

/**
 * Setup connection event handlers for Echo
 */
const setupConnectionEventHandlers = () => {
  if (!echo) return;
  
  const pusher = echo.connector.pusher;
  
  // Connection established
  pusher.connection.bind('connected', () => {
    console.log('Echo connection established');
    reconnectAttempts = 0; // Reset reconnect attempts on successful connection
  });
  
  // Connection error
  pusher.connection.bind('error', (error) => {
    console.error('Echo connection error:', error);
  });
  
  // Disconnected
  pusher.connection.bind('disconnected', () => {
    console.log('Echo disconnected');
  });
  
  // Failed initial connection
  pusher.connection.bind('failed', () => {
    console.error('Echo connection failed');
    attemptReconnect();
  });
};

/**
 * Attempt to reconnect Echo
 */
const attemptReconnect = () => {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error(`Echo reconnection failed after ${MAX_RECONNECT_ATTEMPTS} attempts`);
    return;
  }
  
  reconnectAttempts++;
  console.log(`Attempting to reconnect Echo (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
  
  setTimeout(() => {
    if (echo) {
      echo.connector.pusher.connect();
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        initEcho(token);
      }
    }
  }, RECONNECT_DELAY * reconnectAttempts); // Increase delay with each attempt
};

/**
 * Get the Echo instance
 * @returns {Echo|null} The Echo instance or null if not initialized
 */
export const getEcho = () => {
  return echo;
};

/**
 * Disconnect Echo and clean up
 */
export const disconnectEcho = () => {
  if (echo) {
    echo.disconnect();
    echo = null;
  }
};

/**
 * Subscribe to a private channel
 * @param {string} channelName - The name of the channel without 'private-' prefix
 * @returns {Object} The channel object
 */
export const subscribeToPrivateChannel = (channelName) => {
  if (!echo) {
    console.error('Echo not initialized. Call initEcho first.');
    return null;
  }
  
  return echo.private(`private-${channelName}`);
};

/**
 * Subscribe to a presence channel
 * @param {string} channelName - The name of the channel without 'presence-' prefix
 * @returns {Object} The channel object
 */
export const subscribeToPresenceChannel = (channelName) => {
  if (!echo) {
    console.error('Echo not initialized. Call initEcho first.');
    return null;
  }
  
  return echo.join(`presence-${channelName}`);
};

/**
 * Subscribe to user's notification channel
 * @param {number} userId - The user ID
 * @param {Function} callback - Callback function when notification is received
 * @returns {Object} The channel object
 */
export const subscribeToNotifications = (userId, callback) => {
  if (!echo) {
    console.error('Echo not initialized. Call initEcho first.');
    return null;
  }
  
  return echo.private(`private-user.${userId}`)
    .notification((notification) => {
      if (callback && typeof callback === 'function') {
        callback(notification);
      }
    });
};

/**
 * Subscribe to group channel
 * @param {number} groupId - The group ID
 * @returns {Object} The channel object
 */
export const subscribeToGroup = (groupId) => {
  if (!echo) {
    console.error('Echo not initialized. Call initEcho first.');
    return null;
  }
  
  return echo.private(`private-group.${groupId}`);
};

/**
 * Subscribe to post channel
 * @param {number} postId - The post ID
 * @returns {Object} The channel object
 */
export const subscribeToPost = (postId) => {
  if (!echo) {
    console.error('Echo not initialized. Call initEcho first.');
    return null;
  }
  
  return echo.private(`private-post.${postId}`);
};

export default {
  initEcho,
  getEcho,
  disconnectEcho,
  subscribeToPrivateChannel,
  subscribeToPresenceChannel,
  subscribeToNotifications,
  subscribeToGroup,
  subscribeToPost
};