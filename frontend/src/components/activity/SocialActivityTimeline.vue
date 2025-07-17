<template>
  <div class="timeline-container">
    <div class="timeline-header">
      <h3>{{ title }}</h3>
      <div class="timeline-filters">
        <div class="filter-dropdown">
          <button class="filter-btn" @click="toggleFilterMenu">
            <span>{{ selectedFilter }}</span>
            <span class="icon">▼</span>
          </button>
          <div v-if="showFilterMenu" class="filter-menu">
            <button 
              v-for="filter in availableFilters" 
              :key="filter.value"
              class="filter-option"
              :class="{ 'active': filter.value === currentFilter }"
              @click="setFilter(filter.value)"
            >
              {{ filter.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="timeline-loading">
      <div class="loading-spinner"></div>
      <p>Loading activities...</p>
    </div>
    
    <div v-else-if="filteredActivities.length === 0" class="timeline-empty">
      <div class="empty-icon">📭</div>
      <p>No activities to show</p>
      <button v-if="canRefresh" class="refresh-btn" @click="refreshTimeline">Refresh</button>
    </div>
    
    <div v-else class="timeline-content">
      <transition-group name="timeline-item">
        <div 
          v-for="activity in filteredActivities" 
          :key="activity.id"
          class="activity-item"
          :class="[
            `activity-type-${activity.type}`,
            { 'unread': activity.unread }
          ]"
          @click="handleActivityClick(activity)"
        >
          <div class="activity-indicator" :class="`indicator-${activity.type}`"></div>
          
          <div class="activity-avatar">
            <img :src="activity.actor.avatar" :alt="activity.actor.name" class="avatar-img" />
            <div v-if="activity.type" class="activity-icon" :class="`icon-${activity.type}`">
              <span v-if="activity.type === 'post'">📝</span>
              <span v-else-if="activity.type === 'like'">❤️</span>
              <span v-else-if="activity.type === 'comment'">💬</span>
              <span v-else-if="activity.type === 'share'">🔄</span>
              <span v-else-if="activity.type === 'friend'">👥</span>
              <span v-else-if="activity.type === 'group'">👪</span>
              <span v-else>📣</span>
            </div>
          </div>
          
          <div class="activity-content">
            <div class="activity-header">
              <span class="actor-name">{{ activity.actor.name }}</span>
              <span class="activity-action">{{ getActivityAction(activity) }}</span>
              <span v-if="activity.target" class="activity-target">{{ getActivityTarget(activity) }}</span>
              <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
            </div>
            
            <div v-if="activity.content" class="activity-details">
              <p>{{ activity.content }}</p>
            </div>
            
            <div v-if="activity.media && activity.media.length > 0" class="activity-media">
              <div 
                v-for="(media, index) in activity.media.slice(0, 3)" 
                :key="index"
                class="media-preview"
              >
                <img v-if="media.type === 'image'" :src="media.url" :alt="media.alt || 'Media'" />
                <video v-else-if="media.type === 'video'" controls>
                  <source :src="media.url" :type="media.format || 'video/mp4'">
                </video>
              </div>
              <div v-if="activity.media.length > 3" class="media-more">
                +{{ activity.media.length - 3 }} more
              </div>
            </div>
            
            <div class="activity-engagement">
              <button 
                v-if="canInteract(activity, 'like')" 
                class="engagement-btn"
                :class="{ 'active': activity.userReactions && activity.userReactions.includes('like') }"
                @click.stop="toggleReaction(activity, 'like')"
              >
                <span class="engagement-icon">👍</span>
                <span v-if="activity.likeCount > 0" class="engagement-count">{{ activity.likeCount }}</span>
              </button>
              
              <button 
                v-if="canInteract(activity, 'comment')" 
                class="engagement-btn"
                @click.stop="toggleComments(activity)"
              >
                <span class="engagement-icon">💬</span>
                <span v-if="activity.commentCount > 0" class="engagement-count">{{ activity.commentCount }}</span>
              </button>
              
              <button 
                v-if="canInteract(activity, 'share')" 
                class="engagement-btn"
                @click.stop="shareActivity(activity)"
              >
                <span class="engagement-icon">🔄</span>
              </button>
            </div>
            
            <div v-if="activity.showComments" class="activity-comments">
              <div 
                v-for="comment in activity.comments" 
                :key="comment.id"
                class="comment-item"
              >
                <img :src="comment.user.avatar" :alt="comment.user.name" class="comment-avatar" />
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-user">{{ comment.user.name }}</span>
                    <span class="comment-time">{{ formatTime(comment.timestamp) }}</span>
                  </div>
                  <p class="comment-text">{{ comment.text }}</p>
                </div>
              </div>
              
              <div class="comment-input">
                <input 
                  type="text" 
                  placeholder="Write a comment..." 
                  v-model="newComments[activity.id]"
                  @keyup.enter="addComment(activity)"
                />
                <button 
                  class="send-comment-btn"
                  :disabled="!newComments[activity.id]"
                  @click.stop="addComment(activity)"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition-group>
      
      <div v-if="hasMoreActivities" class="timeline-loader">
        <button 
          class="load-more-btn"
          :disabled="loadingMore"
          @click="loadMoreActivities"
        >
          <span v-if="loadingMore" class="loading-spinner small"></span>
          <span v-else>Load more</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { formatDistanceToNow } from 'date-fns';

const props = defineProps({
  title: {
    type: String,
    default: 'Activity Timeline'
  },
  activities: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  canRefresh: {
    type: Boolean,
    default: true
  },
  hasMoreActivities: {
    type: Boolean,
    default: false
  },
  loadingMore: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'refresh', 
  'load-more', 
  'activity-click', 
  'reaction-toggle', 
  'comment-added',
  'activity-share',
  'filter-change'
]);

// State
const showFilterMenu = ref(false);
const currentFilter = ref('all');
const newComments = ref({});
const expandedActivities = ref(new Set());

// Filters
const availableFilters = [
  { label: 'All Activity', value: 'all' },
  { label: 'Posts', value: 'post' },
  { label: 'Likes', value: 'like' },
  { label: 'Comments', value: 'comment' },
  { label: 'Friend Activity', value: 'friend' },
  { label: 'Group Activity', value: 'group' },
  { label: 'Shares', value: 'share' }
];

// Computed properties
const selectedFilter = computed(() => {
  const filter = availableFilters.find(f => f.value === currentFilter.value);
  return filter ? filter.label : 'All Activity';
});

const filteredActivities = computed(() => {
  let filtered = [...props.activities];
  
  // Apply type filter
  if (currentFilter.value !== 'all') {
    filtered = filtered.filter(activity => activity.type === currentFilter.value);
  }
  
  // Add showComments property
  return filtered.map(activity => ({
    ...activity,
    showComments: expandedActivities.value.has(activity.id)
  }));
});

// Methods
const toggleFilterMenu = () => {
  showFilterMenu.value = !showFilterMenu.value;
};

const setFilter = (filter) => {
  currentFilter.value = filter;
  showFilterMenu.value = false;
  emit('filter-change', filter);
};

const refreshTimeline = () => {
  emit('refresh');
};

const loadMoreActivities = () => {
  emit('load-more');
};

const handleActivityClick = (activity) => {
  emit('activity-click', activity);
};

const toggleReaction = (activity, reactionType) => {
  emit('reaction-toggle', { activity, reactionType });
};

const toggleComments = (activity) => {
  if (expandedActivities.value.has(activity.id)) {
    expandedActivities.value.delete(activity.id);
  } else {
    expandedActivities.value.add(activity.id);
  }
};

const addComment = (activity) => {
  const commentText = newComments.value[activity.id];
  if (commentText && commentText.trim()) {
    emit('comment-added', { 
      activityId: activity.id, 
      text: commentText.trim() 
    });
    newComments.value[activity.id] = '';
  }
};

const shareActivity = (activity) => {
  emit('activity-share', activity);
};

const canInteract = (activity, interactionType) => {
  // You could implement logic here to determine if an interaction is allowed
  // For now, return true for all interactions
  return true;
};

const getActivityAction = (activity) => {
  switch (activity.type) {
    case 'post': return 'posted';
    case 'like': return 'liked';
    case 'comment': return 'commented on';
    case 'share': return 'shared';
    case 'friend': return 'became friends with';
    case 'group': return 'joined group';
    default: return 'acted on';
  }
};

const getActivityTarget = (activity) => {
  if (!activity.target) return '';
  
  if (typeof activity.target === 'string') {
    return activity.target;
  }
  
  return activity.target.name || activity.target.title || '';
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch (error) {
    return timestamp;
  }
};

// Close filter menu when clicking outside
const handleClickOutside = (event) => {
  if (showFilterMenu.value) {
    showFilterMenu.value = false;
  }
};

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

watch(() => props.activities, () => {
  // Reset expanded comments when activities change
  expandedActivities.value = new Set();
});
</script>

<style scoped>
.timeline-container {
  background-color: var(--bg-color, white);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  font-family: var(--font-family, 'Inter', sans-serif);
}

.timeline-header {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
}

.timeline-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color, #1f2937);
}

.filter-dropdown {
  position: relative;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background-color: var(--bg-alt-color, #f3f4f6);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.2s;
}

.filter-btn:hover {
  background-color: var(--hover-color, #e5e7eb);
}

.filter-btn .icon {
  font-size: 0.7rem;
  margin-top: 2px;
}

.filter-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 180px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 10;
  margin-top: 5px;
}

.filter-option {
  display: block;
  width: 100%;
  padding: 10px 15px;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.filter-option:hover {
  background-color: var(--hover-color, #f3f4f6);
}

.filter-option.active {
  background-color: var(--primary-light, rgba(59, 130, 246, 0.1));
  color: var(--primary-color, #3b82f6);
  font-weight: 500;
}

.timeline-content {
  max-height: 600px;
  overflow-y: auto;
}

.timeline-loading, .timeline-empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted, #6b7280);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color, #e5e7eb);
  border-top-color: var(--primary-color, #3b82f6);
  border-radius: 50%;
  margin: 0 auto 15px;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
  display: inline-block;
  vertical-align: middle;
  margin: 0;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.refresh-btn {
  margin-top: 15px;
  padding: 8px 16px;
  background-color: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.refresh-btn:hover {
  background-color: var(--primary-dark, #2563eb);
}

.activity-item {
  position: relative;
  padding: 15px 20px 15px 60px;
  border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
  transition: background-color 0.2s;
}

.activity-item:hover {
  background-color: var(--hover-color, rgba(0, 0, 0, 0.02));
}

.activity-item.unread {
  background-color: var(--unread-bg, rgba(59, 130, 246, 0.05));
}

.activity-indicator {
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: var(--border-color, #e5e7eb);
}

.indicator-post { background-color: #10b981; }
.indicator-like { background-color: #ef4444; }
.indicator-comment { background-color: #f59e0b; }
.indicator-share { background-color: #8b5cf6; }
.indicator-friend { background-color: #3b82f6; }
.indicator-group { background-color: #6366f1; }

.activity-avatar {
  position: absolute;
  left: 15px;
  top: 18px;
}

.avatar-img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
}

.activity-icon {
  position: absolute;
  bottom: -5px;
  right: -5px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  border: 1px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.activity-content {
  width: 100%;
}

.activity-header {
  margin-bottom: 5px;
  line-height: 1.4;
}

.actor-name {
  font-weight: 600;
  color: var(--text-color, #1f2937);
}

.activity-action {
  color: var(--text-muted, #6b7280);
  margin: 0 4px;
}

.activity-target {
  font-weight: 500;
  color: var(--text-color, #1f2937);
}

.activity-time {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted, #6b7280);
  margin-top: 2px;
}

.activity-details {
  margin: 10px 0;
  font-size: 0.95rem;
  color: var(--text-color, #1f2937);
  line-height: 1.5;
}

.activity-media {
  display: flex;
  gap: 5px;
  margin: 10px 0;
}

.media-preview {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.media-preview img, .media-preview video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  color: var(--text-muted, #6b7280);
  font-size: 0.85rem;
  font-weight: 500;
}

.activity-engagement {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.engagement-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: none;
  padding: 5px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.9rem;
  color: var(--text-muted, #6b7280);
}

.engagement-btn:hover {
  background-color: var(--hover-color, rgba(0, 0, 0, 0.05));
}

.engagement-btn.active {
  color: var(--primary-color, #3b82f6);
}

.engagement-icon {
  font-size: 1rem;
}

.engagement-count {
  font-size: 0.9rem;
}

.activity-comments {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
}

.comment-item {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.comment-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-content {
  flex: 1;
  background-color: var(--comment-bg, #f3f4f6);
  border-radius: 12px;
  padding: 8px 12px;
  position: relative;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3px;
}

.comment-user {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-color, #1f2937);
}

.comment-time {
  font-size: 0.75rem;
  color: var(--text-muted, #6b7280);
}

.comment-text {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--text-color, #1f2937);
  word-break: break-word;
}

.comment-input {
  display: flex;
  gap: 5px;
  margin-top: 10px;
}

.comment-input input {
  flex: 1;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 20px;
  padding: 8px 15px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.comment-input input:focus {
  border-color: var(--primary-color, #3b82f6);
}

.send-comment-btn {
  padding: 8px 15px;
  background-color: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-comment-btn:hover {
  background-color: var(--primary-dark, #2563eb);
}

.send-comment-btn:disabled {
  background-color: var(--gray-color, #9ca3af);
  cursor: not-allowed;
}

.timeline-loader {
  padding: 15px;
  text-align: center;
}

.load-more-btn {
  padding: 8px 20px;
  background-color: var(--bg-alt-color, #f3f4f6);
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.load-more-btn:hover {
  background-color: var(--hover-color, #e5e7eb);
}

.load-more-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Timeline item transitions */
.timeline-item-enter-active, .timeline-item-leave-active {
  transition: all 0.3s ease;
}

.timeline-item-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.timeline-item-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .timeline-header {
    padding: 12px 15px;
  }
  
  .activity-item {
    padding: 12px 15px 12px 50px;
  }
  
  .activity-indicator {
    left: 15px;
  }
  
  .activity-avatar {
    left: 10px;
  }
  
  .media-preview, .media-more {
    width: 60px;
    height: 60px;
  }
}
</style> 