<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { subscribeToChannel } from '../../services/echo';

const props = defineProps({
  userId: {
    type: [Number, String],
    default: null
  },
  groupId: {
    type: [Number, String],
    default: null
  },
  feedType: {
    type: String,
    default: 'main', // 'main', 'user', 'group'
    validator: (value) => ['main', 'user', 'group'].includes(value)
  }
});

const store = useStore();
const router = useRouter();

// State variables
const isLoading = ref(false);
const error = ref(null);
const activities = ref([]);
const currentPage = ref(1);
const hasMoreActivities = ref(true);
const activityChannel = ref(null);

// Computed properties
const currentUser = computed(() => store.getters['auth/currentUser']);
const isDarkMode = computed(() => store.getters.isDarkMode);

// Load activities
const loadActivities = async (page = 1) => {
  if (isLoading.value) return;
  
  isLoading.value = true;
  error.value = null;
  
  try {
    let endpoint = '/api/activities';
    const params = { page };
    
    if (props.feedType === 'user' && props.userId) {
      endpoint = `/api/users/${props.userId}/activities`;
    } else if (props.feedType === 'group' && props.groupId) {
      endpoint = `/api/groups/${props.groupId}/activities`;
    }
    
    const response = await fetch(endpoint + '?' + new URLSearchParams(params));
    const data = await response.json();
    
    if (page === 1) {
      activities.value = data.data;
    } else {
      activities.value = [...activities.value, ...data.data];
    }
    
    currentPage.value = page;
    hasMoreActivities.value = page < data.meta.last_page;
  } catch (err) {
    error.value = 'Failed to load activities. Please try again.';
    console.error('Error loading activities:', err);
  } finally {
    isLoading.value = false;
  }
};

// Load more activities (pagination)
const loadMore = () => {
  if (isLoading.value || !hasMoreActivities.value) return;
  
  loadActivities(currentPage.value + 1);
};

// Subscribe to activity channel
const subscribeToActivityChannel = () => {
  if (!currentUser.value) return;
  
  let channelName;
  
  if (props.feedType === 'user' && props.userId) {
    channelName = `user.${props.userId}.activities`;
  } else if (props.feedType === 'group' && props.groupId) {
    channelName = `group.${props.groupId}.activities`;
  } else {
    channelName = `user.${currentUser.value.id}.feed`;
  }
  
  activityChannel.value = subscribeToChannel(channelName)
    .listen('.activity.created', (data) => {
      // Add new activity to the beginning of the list
      activities.value.unshift(data.activity);
    });
};

// Format timestamp
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Get activity icon based on type
const getActivityIcon = (type) => {
  switch (type) {
    case 'post_created': return '📝';
    case 'post_liked': return '❤️';
    case 'post_commented': return '💬';
    case 'friend_request_sent': return '👋';
    case 'friend_request_accepted': return '🤝';
    case 'group_joined': return '👥';
    case 'group_created': return '🌟';
    case 'profile_updated': return '👤';
    default: return '🔔';
  }
};

// Get activity title based on type and data
const getActivityTitle = (activity) => {
  const { type, data, user } = activity;
  const userName = user?.name || 'Someone';
  
  switch (type) {
    case 'post_created':
      return `${userName} created a new post`;
    case 'post_liked':
      return `${userName} liked ${data.target_user_id === currentUser.value?.id ? 'your' : `${data.target_user_name}'s`} post`;
    case 'post_commented':
      return `${userName} commented on ${data.target_user_id === currentUser.value?.id ? 'your' : `${data.target_user_name}'s`} post`;
    case 'friend_request_sent':
      return `${userName} sent a friend request to ${data.target_user_name}`;
    case 'friend_request_accepted':
      return `${userName} accepted ${data.target_user_id === currentUser.value?.id ? 'your' : `${data.target_user_name}'s`} friend request`;
    case 'group_joined':
      return `${userName} joined ${data.group_name}`;
    case 'group_created':
      return `${userName} created a new group: ${data.group_name}`;
    case 'profile_updated':
      return `${userName} updated their profile`;
    default:
      return `${userName} performed an action`;
  }
};

// Navigate to activity target
const navigateToActivity = (activity) => {
  const { type, data } = activity;
  
  switch (type) {
    case 'post_created':
    case 'post_liked':
    case 'post_commented':
      if (data.post_id) {
        router.push(`/posts/${data.post_id}`);
      }
      break;
    case 'friend_request_sent':
    case 'friend_request_accepted':
    case 'profile_updated':
      if (data.target_user_id) {
        router.push(`/profile/${data.target_user_id}`);
      }
      break;
    case 'group_joined':
    case 'group_created':
      if (data.group_id) {
        router.push(`/groups/${data.group_id}`);
      }
      break;
    default:
      // Do nothing for unknown activity types
      break;
  }
};

// Lifecycle hooks
onMounted(() => {
  loadActivities();
  subscribeToActivityChannel();
  
  // Add scroll event listener for infinite scrolling
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  // Unsubscribe from channel
  if (activityChannel.value) {
    activityChannel.value.unsubscribe();
  }
  
  // Remove scroll event listener
  window.removeEventListener('scroll', handleScroll);
});

// Handle scroll for infinite loading
const handleScroll = () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    loadMore();
  }
};
</script>

<template>
  <div class="activity-feed" :class="{ 'dark-mode': isDarkMode }">
    <h2 class="feed-title">
      <span v-if="feedType === 'main'">Activity Feed</span>
      <span v-else-if="feedType === 'user'">User Activity</span>
      <span v-else-if="feedType === 'group'">Group Activity</span>
    </h2>
    
    <div v-if="isLoading && activities.length === 0" class="loading-indicator">
      <div class="spinner"></div>
      <p>Loading activities...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
      <button @click="loadActivities(1)" class="retry-button">Retry</button>
    </div>
    
    <div v-else-if="activities.length === 0" class="empty-feed">
      <p>No activities to display.</p>
    </div>
    
    <ul v-else class="activity-list">
      <li v-for="activity in activities" :key="activity.id" class="activity-item" @click="navigateToActivity(activity)">
        <div class="activity-icon">
          {{ getActivityIcon(activity.type) }}
        </div>
        
        <div class="activity-content">
          <div class="activity-header">
            <span class="activity-title">{{ getActivityTitle(activity) }}</span>
            <span class="activity-time">{{ formatTime(activity.created_at) }}</span>
          </div>
          
          <p v-if="activity.data.content" class="activity-excerpt">
            {{ activity.data.content.length > 100 ? activity.data.content.substring(0, 100) + '...' : activity.data.content }}
          </p>
        </div>
      </li>
    </ul>
    
    <div v-if="isLoading && activities.length > 0" class="loading-more">
      <div class="spinner small"></div>
      <p>Loading more...</p>
    </div>
    
    <div v-if="!isLoading && !hasMoreActivities && activities.length > 0" class="end-message">
      <p>No more activities to load.</p>
    </div>
  </div>
</template>

<style scoped>
.activity-feed {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--border-color);
}

.feed-title {
  margin-top: 0;
  margin-bottom: var(--spacing-lg);
  color: var(--text-color);
  font-size: var(--font-size-xl);
  font-weight: 600;
}

.loading-indicator, .loading-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
  color: var(--text-color-light);
}

.loading-more {
  padding: var(--spacing-sm);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: var(--spacing-sm);
}

.spinner.small {
  width: 24px;
  height: 24px;
  border-width: 2px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: var(--error-color);
  padding: var(--spacing-md);
  background-color: rgba(239, 68, 68, 0.1);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.retry-button {
  background-color: transparent;
  border: 1px solid var(--error-color);
  color: var(--error-color);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.empty-feed {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-color-light);
  font-style: italic;
}

.activity-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.activity-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.activity-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.activity-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(100, 108, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xl);
}

.activity-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--spacing-sm);
}

.activity-title {
  font-weight: 500;
  color: var(--text-color);
  font-size: var(--font-size-md);
}

.activity-time {
  font-size: var(--font-size-xs);
  color: var(--text-color-light);
  white-space: nowrap;
}

.activity-excerpt {
  margin: 0;
  color: var(--text-color-light);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.end-message {
  text-align: center;
  padding: var(--spacing-md);
  color: var(--text-color-light);
  font-size: var(--font-size-sm);
  font-style: italic;
}

/* Dark mode adjustments */
.dark-mode .activity-item {
  background-color: var(--dark-card-bg);
  border-color: var(--dark-border-color);
}

.dark-mode .feed-title,
.dark-mode .activity-title {
  color: var(--dark-text-color);
}

.dark-mode .spinner {
  border-color: rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary-color);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .activity-item {
    padding: var(--spacing-sm);
  }
  
  .activity-icon {
    width: 32px;
    height: 32px;
    font-size: var(--font-size-lg);
  }
  
  .activity-header {
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  .activity-time {
    align-self: flex-start;
  }
}
</style>