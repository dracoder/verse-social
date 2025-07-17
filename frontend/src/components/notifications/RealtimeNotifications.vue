<template>
  <div class="realtime-notifications" :class="{ 'expanded': isExpanded }">
    <!-- Notification Toggle Button -->
    <div 
      class="notification-toggle" 
      @click="toggleNotifications"
      :class="{ 'has-unread': hasUnreadNotifications }"
    >
      <div class="notification-icon">
        <i class="icon-bell"></i>
        <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
      </div>
    </div>
    
    <!-- Notification Panel -->
    <div class="notification-panel" v-if="isExpanded">
      <div class="panel-header">
        <h3>Notifications</h3>
        <div class="header-actions">
          <button class="mark-read-btn" @click="markAllAsRead" :disabled="!hasUnreadNotifications">
            Mark all as read
          </button>
          <button class="close-btn" @click="toggleNotifications">×</button>
        </div>
      </div>
      
      <div class="panel-content" ref="notificationsList">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <span>Loading notifications...</span>
        </div>
        
        <div v-else-if="notifications.length === 0" class="empty-state">
          <div class="empty-icon">🔔</div>
          <p>No notifications yet</p>
        </div>
        
        <template v-else>
          <div 
            v-for="notification in notifications" 
            :key="notification.id"
            class="notification-item"
            :class="{ 'unread': !notification.read_at }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-avatar">
              <img :src="notification.data.sender_avatar || '/images/default-avatar.png'" alt="Avatar" />
            </div>
            
            <div class="notification-content">
              <div class="notification-message" v-html="formatNotificationMessage(notification)"></div>
              <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
            </div>
            
            <div class="notification-actions">
              <button 
                v-if="!notification.read_at" 
                class="read-btn" 
                @click.stop="markAsRead(notification)"
              >
                Mark as read
              </button>
            </div>
          </div>
        </template>
      </div>
      
      <div class="panel-footer">
        <button class="view-all-btn" @click="viewAllNotifications">View all notifications</button>
      </div>
    </div>
    
    <!-- Toast Notifications -->
    <div class="toast-container">
      <transition-group name="toast">
        <div 
          v-for="toast in toastNotifications" 
          :key="toast.id"
          class="toast-notification"
          :class="{ 'interactive': toast.isInteractive }"
          @click="handleToastClick(toast)"
        >
          <div class="toast-avatar">
            <img :src="toast.avatar || '/images/default-avatar.png'" alt="Avatar" />
          </div>
          <div class="toast-content">
            <div class="toast-message" v-html="toast.message"></div>
            <div class="toast-time">{{ formatTime(toast.time) }}</div>
          </div>
          <button class="toast-close" @click.stop="dismissToast(toast.id)">×</button>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import Echo from 'laravel-echo';

const props = defineProps({
  userId: {
    type: [Number, String],
    required: true
  }
});

const router = useRouter();

// State
const notifications = ref([]);
const toastNotifications = ref([]);
const isExpanded = ref(false);
const loading = ref(false);
const unreadCount = ref(0);
const notificationsList = ref(null);

// Computed properties
const hasUnreadNotifications = computed(() => {
  return unreadCount.value > 0;
});

// Setup Echo for real-time notifications
let echo = null;

// Fetch notifications
const fetchNotifications = async () => {
  loading.value = true;
  try {
    const response = await axios.get('/api/notifications');
    notifications.value = response.data.notifications;
    unreadCount.value = response.data.unread_count;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
  } finally {
    loading.value = false;
  }
};

// Format notification message with HTML
const formatNotificationMessage = (notification) => {
  const data = notification.data;
  
  switch (data.type) {
    case 'new_follower':
      return `<strong>${data.sender_name}</strong> started following you`;
      
    case 'new_like':
      return `<strong>${data.sender_name}</strong> liked your ${data.content_type}`;
      
    case 'new_comment':
      return `<strong>${data.sender_name}</strong> commented on your ${data.content_type}`;
      
    case 'profile_update':
      return `<strong>${data.sender_name}</strong> updated their profile`;
      
    case 'group_invitation':
      return `<strong>${data.sender_name}</strong> invited you to join <strong>${data.group_name}</strong>`;
      
    case 'group_post':
      return `<strong>${data.sender_name}</strong> posted in <strong>${data.group_name}</strong>`;
      
    default:
      return data.message || 'You have a new notification';
  }
};

// Format time (e.g., "2 hours ago", "Just now")
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Toggle notifications panel
const toggleNotifications = () => {
  isExpanded.value = !isExpanded.value;
  
  if (isExpanded.value) {
    fetchNotifications();
    // Add click outside listener
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
  } else {
    document.removeEventListener('click', handleClickOutside);
  }
};

// Handle click outside to close panel
const handleClickOutside = (event) => {
  const panel = document.querySelector('.notification-panel');
  const toggle = document.querySelector('.notification-toggle');
  
  if (panel && !panel.contains(event.target) && !toggle.contains(event.target)) {
    isExpanded.value = false;
    document.removeEventListener('click', handleClickOutside);
  }
};

// Mark notification as read
const markAsRead = async (notification) => {
  if (notification.read_at) return;
  
  try {
    await axios.post(`/api/notifications/${notification.id}/read`);
    notification.read_at = new Date().toISOString();
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
};

// Mark all notifications as read
const markAllAsRead = async () => {
  try {
    await axios.post('/api/notifications/read-all');
    notifications.value = notifications.value.map(notification => ({
      ...notification,
      read_at: notification.read_at || new Date().toISOString()
    }));
    unreadCount.value = 0;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
  }
};

// Handle notification click
const handleNotificationClick = (notification) => {
  markAsRead(notification);
  
  // Navigate based on notification type
  const data = notification.data;
  
  switch (data.type) {
    case 'new_follower':
      router.push(`/profile/${data.sender_id}`);
      break;
      
    case 'new_like':
    case 'new_comment':
      router.push(data.redirect_url);
      break;
      
    case 'profile_update':
      router.push(`/profile/${data.sender_id}`);
      break;
      
    case 'group_invitation':
      router.push(`/groups/${data.group_id}`);
      break;
      
    case 'group_post':
      router.push(`/groups/${data.group_id}/posts/${data.post_id}`);
      break;
      
    default:
      if (data.redirect_url) {
        router.push(data.redirect_url);
      }
  }
  
  isExpanded.value = false;
};

// View all notifications
const viewAllNotifications = () => {
  router.push('/notifications');
  isExpanded.value = false;
};

// Show toast notification
const showToast = (data) => {
  // Create a unique ID for the toast
  const id = Date.now().toString();
  
  // Create toast notification
  const toast = {
    id,
    message: formatNotificationMessage({ data }),
    time: new Date(),
    avatar: data.sender_avatar,
    isInteractive: !!data.redirect_url,
    data
  };
  
  // Add to toasts
  toastNotifications.value.push(toast);
  
  // Auto dismiss after 5 seconds
  setTimeout(() => {
    dismissToast(id);
  }, 5000);
};

// Dismiss toast notification
const dismissToast = (id) => {
  toastNotifications.value = toastNotifications.value.filter(toast => toast.id !== id);
};

// Handle toast click
const handleToastClick = (toast) => {
  if (!toast.isInteractive) return;
  
  // Navigate based on notification type
  const data = toast.data;
  
  switch (data.type) {
    case 'new_follower':
      router.push(`/profile/${data.sender_id}`);
      break;
      
    case 'new_like':
    case 'new_comment':
      router.push(data.redirect_url);
      break;
      
    case 'profile_update':
      router.push(`/profile/${data.sender_id}`);
      break;
      
    case 'group_invitation':
      router.push(`/groups/${data.group_id}`);
      break;
      
    case 'group_post':
      router.push(`/groups/${data.group_id}/posts/${data.post_id}`);
      break;
      
    default:
      if (data.redirect_url) {
        router.push(data.redirect_url);
      }
  }
  
  dismissToast(toast.id);
};

// Subscribe to real-time notifications
const subscribeToNotifications = () => {
  echo = new Echo({
    broadcaster: 'pusher',
    key: process.env.VUE_APP_PUSHER_APP_KEY,
    cluster: process.env.VUE_APP_PUSHER_APP_CLUSTER,
    encrypted: true
  });
  
  // Listen for private channel notifications
  echo.private(`App.Models.User.${props.userId}`)
    .notification((notification) => {
      // Update unread count
      unreadCount.value++;
      
      // Add to notifications list if the panel is open
      if (isExpanded.value) {
        notifications.value = [notification, ...notifications.value];
      }
      
      // Show toast notification
      showToast(notification.data);
    });
};

// Lifecycle hooks
onMounted(() => {
  // Fetch initial notifications
  fetchNotifications();
  
  // Setup real-time notifications
  subscribeToNotifications();
});

onUnmounted(() => {
  // Cleanup
  if (echo) {
    echo.disconnect();
  }
  document.removeEventListener('click', handleClickOutside);
});

// Watch for changes in notifications to scroll to top when new ones arrive
watch(notifications, () => {
  if (notificationsList.value) {
    notificationsList.value.scrollTop = 0;
  }
});
</script>

<style scoped>
.realtime-notifications {
  position: relative;
}

.notification-toggle {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--bg-alt-color, #f3f4f6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.notification-toggle:hover {
  background-color: var(--hover-color, #e5e7eb);
}

.notification-toggle.has-unread {
  background-color: var(--primary-light, #dbeafe);
}

.notification-icon {
  position: relative;
  font-size: 1.2rem;
  color: var(--text-color, #1f2937);
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: var(--danger-color, #ef4444);
  color: white;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.notification-panel {
  position: absolute;
  top: 45px;
  right: 0;
  width: 350px;
  max-height: 480px;
  background-color: var(--bg-color, white);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideDown 0.3s ease;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.panel-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-color, #1f2937);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mark-read-btn {
  padding: 5px 10px;
  font-size: 0.75rem;
  border: none;
  background-color: transparent;
  color: var(--primary-color, #3b82f6);
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.mark-read-btn:hover {
  background-color: var(--primary-light, #dbeafe);
}

.mark-read-btn:disabled {
  color: var(--gray-color, #9ca3af);
  cursor: not-allowed;
}

.close-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-alt-color, #f3f4f6);
  border: none;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: var(--hover-color, #e5e7eb);
}

.panel-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 0;
  max-height: 380px;
}

.loading-state, .empty-state {
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--gray-color, #9ca3af);
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--border-color, #e5e7eb);
  border-top-color: var(--primary-color, #3b82f6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 10px;
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.notification-item {
  padding: 15px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: var(--hover-color, #f9fafb);
}

.notification-item.unread {
  background-color: var(--primary-lightest, #eff6ff);
}

.notification-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.notification-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.notification-content {
  flex-grow: 1;
}

.notification-message {
  margin-bottom: 5px;
  color: var(--text-color, #1f2937);
  font-size: 0.9rem;
  line-height: 1.4;
}

.notification-time {
  font-size: 0.75rem;
  color: var(--gray-color, #6b7280);
}

.notification-actions {
  margin-left: auto;
  flex-shrink: 0;
}

.read-btn {
  padding: 4px 8px;
  font-size: 0.7rem;
  border: none;
  background-color: var(--primary-light, #dbeafe);
  color: var(--primary-color, #3b82f6);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.read-btn:hover {
  background-color: var(--primary-lighter, #bfdbfe);
}

.panel-footer {
  padding: 12px;
  border-top: 1px solid var(--border-color, #e5e7eb);
  text-align: center;
}

.view-all-btn {
  width: 100%;
  padding: 8px;
  background-color: var(--bg-alt-color, #f3f4f6);
  border: none;
  border-radius: 6px;
  color: var(--text-color, #1f2937);
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.view-all-btn:hover {
  background-color: var(--hover-color, #e5e7eb);
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 9999;
}

.toast-notification {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background-color: var(--bg-color, white);
  border-radius: 10px;
  padding: 12px;
  width: 300px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease;
  border-left: 4px solid var(--primary-color, #3b82f6);
}

.toast-notification.interactive {
  cursor: pointer;
}

.toast-notification.interactive:hover {
  background-color: var(--hover-color, #f9fafb);
  transform: translateY(-2px);
  transition: transform 0.2s;
}

.toast-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.toast-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.toast-content {
  flex-grow: 1;
}

.toast-message {
  margin-bottom: 3px;
  color: var(--text-color, #1f2937);
  font-size: 0.85rem;
  line-height: 1.4;
}

.toast-time {
  font-size: 0.7rem;
  color: var(--gray-color, #6b7280);
}

.toast-close {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: var(--bg-alt-color, #f3f4f6);
  border: none;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background-color 0.2s;
}

.toast-close:hover {
  background-color: var(--hover-color, #e5e7eb);
}

/* Animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@media (max-width: 768px) {
  .notification-panel {
    width: 100vw;
    max-width: 100%;
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 12px 12px 0 0;
    max-height: 80vh;
  }
  
  .toast-container {
    bottom: 10px;
    right: 10px;
    left: 10px;
  }
  
  .toast-notification {
    width: 100%;
  }
}
</style> 