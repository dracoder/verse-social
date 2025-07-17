<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

const store = useStore();
const router = useRouter();

// State variables
const isLoading = ref(false);
const error = ref(null);
const showPanel = ref(false);
const notificationChannel = ref(null);
const currentUser = computed(() => store.getters['auth/currentUser']);

// Subscribe to user notifications
const subscribeToUserNotifications = () => {
  if (!currentUser.value) return;
  
  notificationChannel.value = subscribeToNotifications(currentUser.value.id, (notification) => {
    // Add notification to store
    store.commit('notifications/ADD_NOTIFICATION', notification);
    
    // Show notification toast
    showNotificationToast(notification);
  });
};

// Get notification icon based on type
// const getNotificationIcon = (type) => {
//   switch (type) {
//     case 'post_liked': return '❤️';
//     case 'post_commented': return '💬';
//     case 'friend_request': return '👋';
//     case 'group_invitation': return '👥';
//     case 'post_created': return '📝';
//     case 'group_role_updated': return '🔑';
//     case 'profile_updated': return '👤';
//     default: return '🔔';
//   }
// };

// Show notification toast
const showNotificationToast = (notification) => {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'notification-toast';
  
  // Create toast content
  const content = document.createElement('div');
  content.className = 'toast-content';
  
  // Create icon based on notification type
  const icon = document.createElement('div');
  icon.className = 'toast-icon';
  icon.textContent = getNotificationIcon(notification.type);
  
  // Create message
  const message = document.createElement('div');
  message.className = 'toast-message';
  message.textContent = getNotificationMessage(notification);
  
  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => {
    toast.classList.add('hide');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  });
  
  // Create action button if applicable
  if (notification.type === 'friend_request' || notification.type === 'group_invitation') {
    const actionBtn = document.createElement('button');
    actionBtn.className = 'toast-action';
    actionBtn.textContent = notification.type === 'friend_request' ? 'Accept' : 'View';
    actionBtn.addEventListener('click', () => {
      // Handle action based on notification type
      if (notification.type === 'friend_request') {
        // Accept friend request logic would go here
        console.log('Accepting friend request:', notification.data.user_id);
      } else if (notification.type === 'group_invitation') {
        // Navigate to group
        router.push(`/groups/${notification.data.group_slug}`);
      }
      
      // Close toast
      toast.classList.add('hide');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    });
    content.appendChild(actionBtn);
  }
  
  // Assemble toast
  content.appendChild(icon);
  content.appendChild(message);
  toast.appendChild(content);
  toast.appendChild(closeBtn);
  
  // Add to document
  document.body.appendChild(toast);
  
  // Remove after timeout
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 5000);
};

// Computed properties
const notifications = computed(() => store.getters['notifications/allNotifications']);
const unreadCount = computed(() => store.getters['notifications/unreadCount']);
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);

// Toggle notifications panel
const togglePanel = () => {
  showPanel.value = !showPanel.value;
  
  // If opening panel and there are unread notifications, mark them as read
  if (showPanel.value && unreadCount.value > 0) {
    markAllAsRead();
  }
};

// Load notifications
const loadNotifications = async () => {
  if (!isAuthenticated.value) return;
  
  isLoading.value = true;
  error.value = null;
  
  try {
    await store.dispatch('notifications/fetchNotifications');
  } catch (err) {
    error.value = 'Failed to load notifications';
    console.error('Error loading notifications:', err);
  } finally {
    isLoading.value = false;
  }
};

// Mark a notification as read
const markAsRead = async (notificationId) => {
  try {
    await store.dispatch('notifications/markAsRead', notificationId);
  } catch (err) {
    console.error('Error marking notification as read:', err);
  }
};

// Mark all notifications as read
const markAllAsRead = async () => {
  try {
    await store.dispatch('notifications/markAllAsRead');
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
  }
};

// Delete a notification
const deleteNotification = async (notificationId) => {
  try {
    await store.dispatch('notifications/deleteNotification', notificationId);
  } catch (err) {
    console.error('Error deleting notification:', err);
  }
};

// Handle notification click
const handleNotificationClick = (notification) => {
  // Mark as read
  if (!notification.read_at) {
    markAsRead(notification.id);
  }
  
  // Navigate based on notification type
  if (notification.type === 'post_created' || notification.type === 'post_liked' || notification.type === 'post_commented') {
    router.push(`/posts/${notification.data.post_id}`);
  } else if (notification.type === 'group_invitation' || notification.type === 'group_role_updated') {
    router.push(`/groups/${notification.data.group_slug}`);
  } else if (notification.type === 'friend_request' || notification.type === 'profile_updated') {
    router.push(`/profile/${notification.data.user_id}`);
  }
  
  // Close panel
  showPanel.value = false;
};

// Format notification time
const formatTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} min ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hr ago`;
  } else if (diffDay < 7) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'post_liked': return '❤️';
    case 'post_commented': return '💬';
    case 'friend_request': return '👋';
    case 'group_invitation': return '👥';
    case 'post_created': return '📝';
    case 'group_role_updated': return '🔑';
    case 'profile_updated': return '👤';
    default: return '🔔';
  }
};

// Get notification icon based on type
// const getNotificationIcon = (type) => {
//   switch (type) {
//     case 'post_created':
//       return '📝';
//     case 'post_liked':
//       return '👍';
//     case 'post_commented':
//       return '💬';
//     case 'group_invitation':
//       return '👥';
//     case 'group_role_updated':
//       return '🔑';
//     case 'friend_request':
//       return '🤝';
//     case 'profile_updated':
//       return '👤';
//     default:
//       return '🔔';
//   }
// };

// Get notification message
// const getNotificationMessage = (notification) => {
//   switch (notification.type) {
//     case 'post_liked':
//       return `${notification.data.user_name} liked your post`;
//     case 'post_commented':
//       return `${notification.data.user_name} commented on your post`;
//     case 'friend_request':
//       return `${notification.data.user_name} sent you a friend request`;
//     case 'group_invitation':
//       return `You were invited to join ${notification.data.group_name}`;
//     case 'post_created':
//       return `${notification.data.user_name} created a new post in ${notification.data.group_name || 'your feed'}`;
//     case 'group_role_updated':
//       return `Your role in ${notification.data.group_name} was updated to ${notification.data.role}`;
//     case 'profile_updated':
//       return `${notification.data.user_name} updated their profile`;
//     default:
//       return notification.data.message || 'You have a new notification';
//   }
// };

// Get notification message based on type and data
const getNotificationMessage = (notification) => {
  const { type, data } = notification;
  
  switch (type) {
    case 'post_created':
      return `${data.user_name} created a new post`;
    case 'post_liked':
      return `${data.user_name} liked your post`;
    case 'post_commented':
      return `${data.user_name} commented on your post: "${data.comment_preview}"`;
    case 'group_invitation':
      return `You've been invited to join ${data.group_name}`;
    case 'group_role_updated':
      return `Your role in ${data.group_name} has been updated to ${data.role}`;
    case 'friend_request':
      return `${data.user_name} sent you a friend request`;
    case 'profile_updated':
      return `${data.user_name} updated their profile`;
    default:
      return 'You have a new notification';
  }
};

// Close panel when clicking outside
const panelRef = ref(null);
const handleClickOutside = (event) => {
  if (panelRef.value && !panelRef.value.contains(event.target) && !event.target.closest('.notification-bell')) {
    showPanel.value = false;
  }
};

// Lifecycle hooks
onMounted(() => {
  loadNotifications();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Watch for authentication changes
watch(isAuthenticated, (newValue) => {
  if (newValue) {
    loadNotifications();
  }
});
</script>

<template>
  <div class="notifications-container">
    <!-- Notification bell with badge -->
    <div class="notification-bell" @click.stop="togglePanel">
      <i class="bell-icon">🔔</i>
      <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
    </div>
    
    <!-- Notifications panel -->
    <div v-if="showPanel" ref="panelRef" class="notifications-panel">
      <div class="panel-header">
        <h3>Notifications</h3>
        <button 
          v-if="notifications.length > 0" 
          @click="markAllAsRead" 
          class="mark-all-read"
        >
          Mark all as read
        </button>
      </div>
      
      <!-- Loading state -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading notifications...</p>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="loadNotifications">Try Again</button>
      </div>
      
      <!-- Empty state -->
      <div v-else-if="notifications.length === 0" class="empty-state">
        <p>No notifications yet</p>
      </div>
      
      <!-- Notifications list -->
      <div v-else class="notifications-list">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          :class="['notification-item', { 'unread': !notification.read_at }]"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon">
            <span>{{ getNotificationIcon(notification.type) }}</span>
          </div>
          
          <div class="notification-content">
            <p class="notification-message">{{ getNotificationMessage(notification) }}</p>
            <span class="notification-time">{{ formatTime(notification.created_at) }}</span>
          </div>
          
          <button 
            @click.stop="deleteNotification(notification.id)" 
            class="delete-notification"
            title="Delete notification"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notifications-container {
  position: relative;
}

.notification-bell {
  position: relative;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bell-icon {
  font-size: 24px;
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notifications-panel {
  position: absolute;
  top: 100%;
  right: 0;
  width: 350px;
  max-height: 500px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #e4e6eb;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
}

.mark-all-read {
  background: none;
  border: none;
  color: #1877f2;
  font-size: 14px;
  cursor: pointer;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 15px;
  text-align: center;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #1877f2;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state button {
  background-color: #1877f2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  margin-top: 10px;
  cursor: pointer;
}

.notifications-list {
  overflow-y: auto;
  max-height: 400px;
}

.notification-item {
  display: flex;
  padding: 12px 15px;
  border-bottom: 1px solid #e4e6eb;
  cursor: pointer;
  position: relative;
}

.notification-item:hover {
  background-color: #f0f2f5;
}

.notification-item.unread {
  background-color: #e6f2ff;
}

.notification-icon {
  margin-right: 12px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-content {
  flex-grow: 1;
}

.notification-message {
  margin: 0 0 5px 0;
  font-size: 14px;
  line-height: 1.4;
}

.notification-time {
  font-size: 12px;
  color: #65676b;
}

.delete-notification {
  background: none;
  border: none;
  color: #65676b;
  font-size: 18px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
  position: absolute;
  top: 10px;
  right: 10px;
}

.notification-item:hover .delete-notification {
  opacity: 1;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .notifications-panel {
    width: 100%;
    position: fixed;
    top: 60px;
    right: 0;
    left: 0;
    max-height: calc(100vh - 60px);
    border-radius: 0;
  }
}
</style>