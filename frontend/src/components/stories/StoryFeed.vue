<template>
  <div class="story-feed">
    <div class="story-carousel">
      <!-- Current user's story (Create story) -->
      <div class="story-item your-story">
        <div class="story-avatar-wrapper" @click="handleCreateStory">
          <div class="story-avatar your-avatar">
            <img :src="currentUserAvatar" :alt="currentUserName" />
            <div class="add-story-icon">+</div>
          </div>
        </div>
        <div class="story-username">Your Story</div>
      </div>
      
      <!-- Other users' stories -->
      <div 
        v-for="(user, index) in userStories" 
        :key="user.id"
        class="story-item"
        @click="openStory(index)"
      >
        <div class="story-avatar-wrapper">
          <div 
            class="story-avatar"
            :class="{ 
              'has-story': user.hasStory, 
              'viewed': user.allStoriesViewed,
              'live': user.isLive
            }"
          >
            <img :src="user.avatar" :alt="user.name" />
            <div v-if="user.isLive" class="live-badge">LIVE</div>
          </div>
        </div>
        <div class="story-username">{{ user.name }}</div>
      </div>
    </div>
    
    <!-- Story Viewer Modal -->
    <story-viewer
      :is-active="showStoryViewer"
      :stories="activeStories"
      :initial-index="activeStoryIndex"
      @close="closeStoryViewer"
      @view-complete="handleViewComplete"
      @reply="handleStoryReply"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import StoryViewer from './StoryViewer.vue';

const props = defineProps({
  currentUserAvatar: {
    type: String,
    default: '/images/avatars/default.png'
  },
  currentUserName: {
    type: String,
    default: 'You'
  },
  userStories: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['create-story', 'view-story', 'story-viewed', 'story-reply']);

// State
const showStoryViewer = ref(false);
const activeUserIndex = ref(0);
const activeStoryIndex = ref(0);

// Computed properties
const activeStories = computed(() => {
  if (!props.userStories[activeUserIndex.value]) return [];
  return props.userStories[activeUserIndex.value].stories || [];
});

// Methods
const handleCreateStory = () => {
  emit('create-story');
};

const openStory = (userIndex) => {
  if (props.userStories[userIndex] && props.userStories[userIndex].stories && props.userStories[userIndex].stories.length > 0) {
    activeUserIndex.value = userIndex;
    // Find the first unviewed story, or default to the first one
    const firstUnviewedIndex = props.userStories[userIndex].stories.findIndex(story => !story.viewed);
    activeStoryIndex.value = firstUnviewedIndex >= 0 ? firstUnviewedIndex : 0;
    showStoryViewer.value = true;
    
    emit('view-story', {
      userId: props.userStories[userIndex].id,
      storyId: activeStories.value[activeStoryIndex.value].id
    });
  }
};

const closeStoryViewer = () => {
  showStoryViewer.value = false;
};

const handleViewComplete = () => {
  // Mark all stories as viewed for this user
  if (props.userStories[activeUserIndex.value]) {
    const userId = props.userStories[activeUserIndex.value].id;
    const viewedStories = props.userStories[activeUserIndex.value].stories.map(story => story.id);
    
    emit('story-viewed', {
      userId,
      storyIds: viewedStories
    });
  }
};

const handleStoryReply = (reply) => {
  emit('story-reply', reply);
};
</script>

<style scoped>
.story-feed {
  margin: 20px 0;
}

.story-carousel {
  display: flex;
  overflow-x: auto;
  padding: 5px 0 15px;
  gap: 15px;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb, rgba(0, 0, 0, 0.2)) transparent;
}

.story-carousel::-webkit-scrollbar {
  height: 6px;
}

.story-carousel::-webkit-scrollbar-track {
  background: transparent;
}

.story-carousel::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thumb, rgba(0, 0, 0, 0.2));
  border-radius: 3px;
}

.story-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  min-width: 75px;
  transition: transform 0.2s;
}

.story-item:hover {
  transform: translateY(-2px);
}

.story-avatar-wrapper {
  width: 75px;
  height: 75px;
  border-radius: 50%;
  padding: 2px;
  margin-bottom: 8px;
  background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
}

.story-avatar.viewed + .story-avatar-wrapper {
  background: var(--border-color, #d1d5db);
}

.story-avatar.has-story.viewed + .story-avatar-wrapper {
  background: var(--border-color, #d1d5db);
}

.story-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid white;
  position: relative;
}

.story-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.your-story .story-avatar-wrapper {
  background: var(--primary-color, #3b82f6);
}

.add-story-icon {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 26px;
  height: 26px;
  background-color: var(--primary-color, #3b82f6);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 600;
  border: 2px solid white;
}

.live-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #ef4444;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.story-avatar.live::before {
  content: '';
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  border-radius: 50%;
  background: linear-gradient(45deg, #ef4444, #f87171);
  z-index: -1;
  animation: pulse 1.5s infinite;
}

.story-username {
  font-size: 0.8rem;
  max-width: 75px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-color, #1f2937);
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    opacity: 1;
  }
  70% {
    transform: scale(1.05);
    opacity: 0.7;
  }
  100% {
    transform: scale(0.95);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .story-avatar-wrapper {
    width: 65px;
    height: 65px;
  }
  
  .story-item {
    min-width: 65px;
  }
  
  .story-username {
    max-width: 65px;
    font-size: 0.75rem;
  }
}
</style> 