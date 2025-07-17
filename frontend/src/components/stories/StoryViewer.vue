<template>
  <div class="story-viewer-container" :class="{ 'is-active': isActive }">
    <!-- Story overlay -->
    <div class="story-overlay" @click="closeStory"></div>
    
    <!-- Story content -->
    <div class="story-content" @click="handleContentClick">
      <div class="story-header">
        <div class="user-info">
          <img :src="currentStory.user.avatar" :alt="currentStory.user.name" class="user-avatar" />
          <div class="user-details">
            <div class="user-name">{{ currentStory.user.name }}</div>
            <div class="story-time">{{ formatTime(currentStory.timestamp) }}</div>
          </div>
        </div>
        
        <div class="story-actions">
          <button v-if="canMute" class="action-btn mute-btn" @click.stop="toggleMute">
            <span v-if="isMuted">🔇</span>
            <span v-else>🔊</span>
          </button>
          
          <button class="action-btn close-btn" @click.stop="closeStory">×</button>
        </div>
      </div>
      
      <!-- Progress bars -->
      <div class="story-progress">
        <div 
          v-for="(story, index) in stories" 
          :key="index"
          class="progress-bar"
          :class="{ 'active': index === currentIndex, 'viewed': index < currentIndex }"
        >
          <div 
            class="progress-fill"
            :style="{ width: getProgressWidth(index) }"
          ></div>
        </div>
      </div>
      
      <!-- Story media -->
      <div class="story-media-container">
        <div v-if="currentStory.type === 'image'" class="story-image">
          <img :src="currentStory.media" :alt="currentStory.user.name + '\'s story'" />
        </div>
        
        <div v-else-if="currentStory.type === 'video'" class="story-video">
          <video 
            ref="videoElement" 
            :src="currentStory.media" 
            :muted="isMuted"
            autoplay
            playsinline
            @timeupdate="updateVideoProgress"
            @ended="handleMediaEnd"
          ></video>
        </div>
        
        <div class="story-caption" v-if="currentStory.caption">
          {{ currentStory.caption }}
        </div>
        
        <!-- Story stickers and overlays -->
        <div 
          v-for="(sticker, stickerIndex) in currentStory.stickers" 
          :key="stickerIndex"
          class="story-sticker"
          :style="{
            top: `${sticker.position.top}%`,
            left: `${sticker.position.left}%`,
            transform: `translate(-50%, -50%) rotate(${sticker.rotation || 0}deg)`,
            fontSize: sticker.type === 'text' ? `${sticker.size || 1}rem` : 'inherit'
          }"
        >
          <img v-if="sticker.type === 'image'" :src="sticker.content" :alt="sticker.alt || 'Sticker'" />
          <div v-else-if="sticker.type === 'text'" class="text-sticker" :style="{ 
            color: sticker.color || 'white', 
            backgroundColor: sticker.backgroundColor || 'transparent'
          }">
            {{ sticker.content }}
          </div>
          <div v-else-if="sticker.type === 'emoji'" class="emoji-sticker">
            {{ sticker.content }}
          </div>
        </div>
      </div>
      
      <!-- Story reply -->
      <div class="story-reply" v-if="allowReplies">
        <input 
          type="text" 
          v-model="replyText" 
          placeholder="Reply to this story..." 
          @keyup.enter="sendReply"
        />
        <button 
          class="send-btn"
          :disabled="!replyText.trim()"
          @click.stop="sendReply"
        >
          Send
        </button>
      </div>
    </div>
    
    <!-- Navigation buttons -->
    <button 
      v-if="currentIndex > 0" 
      class="nav-btn prev-btn"
      @click.stop="prevStory"
    >
      ‹
    </button>
    
    <button 
      v-if="currentIndex < stories.length - 1" 
      class="nav-btn next-btn"
      @click.stop="nextStory"
    >
      ›
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { formatDistanceToNow } from 'date-fns';

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  },
  stories: {
    type: Array,
    default: () => []
  },
  initialIndex: {
    type: Number,
    default: 0
  },
  autoPlay: {
    type: Boolean,
    default: true
  },
  storyDuration: {
    type: Number,
    default: 5000 // 5 seconds
  },
  allowReplies: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['close', 'story-change', 'view-complete', 'reply']);

// State
const currentIndex = ref(props.initialIndex);
const progressValue = ref(0);
const intervalId = ref(null);
const isMuted = ref(false);
const replyText = ref('');
const videoElement = ref(null);

// Computed properties
const currentStory = computed(() => {
  return props.stories[currentIndex.value] || {};
});

const canMute = computed(() => {
  return currentStory.value.type === 'video';
});

// Methods
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch (error) {
    return timestamp;
  }
};

const getProgressWidth = (index) => {
  if (index < currentIndex.value) {
    return '100%';
  } else if (index > currentIndex.value) {
    return '0%';
  }
  
  return `${progressValue.value}%`;
};

const closeStory = () => {
  clearProgressInterval();
  emit('close');
};

const prevStory = () => {
  if (currentIndex.value > 0) {
    progressValue.value = 0;
    currentIndex.value--;
    emit('story-change', currentIndex.value);
    resetProgressInterval();
  }
};

const nextStory = () => {
  if (currentIndex.value < props.stories.length - 1) {
    progressValue.value = 0;
    currentIndex.value++;
    emit('story-change', currentIndex.value);
    resetProgressInterval();
  } else {
    // End of stories
    clearProgressInterval();
    emit('view-complete');
    emit('close');
  }
};

const handleContentClick = (event) => {
  // Get click position
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const width = rect.width;
  
  // If clicked on the left third, go back, otherwise go forward
  if (x < width / 3) {
    prevStory();
  } else {
    nextStory();
  }
};

const toggleMute = () => {
  isMuted.value = !isMuted.value;
};

const handleMediaEnd = () => {
  if (props.autoPlay) {
    nextStory();
  }
};

const sendReply = () => {
  if (replyText.value.trim()) {
    emit('reply', {
      storyId: currentStory.value.id,
      userId: currentStory.value.user.id,
      text: replyText.value
    });
    replyText.value = '';
  }
};

const updateVideoProgress = () => {
  if (videoElement.value) {
    const video = videoElement.value;
    progressValue.value = (video.currentTime / video.duration) * 100;
  }
};

// Progress interval for images
const startProgressInterval = () => {
  if (currentStory.value.type === 'image' && props.autoPlay) {
    clearProgressInterval();
    progressValue.value = 0;
    
    const updateProgress = () => {
      progressValue.value += (100 / props.storyDuration) * 100; // increase by percentage per 100ms
      
      if (progressValue.value >= 100) {
        clearProgressInterval();
        nextStory();
      }
    };
    
    intervalId.value = setInterval(updateProgress, 100);
  }
};

const resetProgressInterval = () => {
  if (currentStory.value.type === 'video') {
    if (videoElement.value) {
      videoElement.value.currentTime = 0;
      videoElement.value.play().catch(error => console.error("Error playing video:", error));
    }
  } else {
    startProgressInterval();
  }
};

const clearProgressInterval = () => {
  if (intervalId.value) {
    clearInterval(intervalId.value);
    intervalId.value = null;
  }
};

// Handle keyboard navigation
const handleKeydown = (event) => {
  if (!props.isActive) return;
  
  if (event.key === 'ArrowLeft') {
    prevStory();
  } else if (event.key === 'ArrowRight') {
    nextStory();
  } else if (event.key === 'Escape') {
    closeStory();
  }
};

// Pause/resume based on visibility
const handleVisibilityChange = () => {
  if (document.hidden) {
    // Page is hidden, pause progress
    clearProgressInterval();
    if (videoElement.value) {
      videoElement.value.pause();
    }
  } else {
    // Page is visible again, resume progress
    resetProgressInterval();
  }
};

// Lifecycle hooks
watch(() => props.isActive, (newValue) => {
  if (newValue) {
    resetProgressInterval();
  } else {
    clearProgressInterval();
  }
});

watch(() => props.initialIndex, (newValue) => {
  if (props.isActive) {
    currentIndex.value = newValue;
    progressValue.value = 0;
    resetProgressInterval();
  }
});

watch(() => currentIndex.value, () => {
  progressValue.value = 0;
});

onMounted(() => {
  if (props.isActive) {
    resetProgressInterval();
  }
  
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onBeforeUnmount(() => {
  clearProgressInterval();
  document.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<style scoped>
.story-viewer-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
}

.story-viewer-container.is-active {
  opacity: 1;
  visibility: visible;
}

.story-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 0;
}

.story-content {
  position: relative;
  width: 100%;
  max-width: 400px;
  height: 100%;
  max-height: 700px;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  z-index: 1;
  display: flex;
  flex-direction: column;
}

.story-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  z-index: 2;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  margin-right: 10px;
}

.user-details {
  color: white;
}

.user-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.story-time {
  font-size: 0.8rem;
  opacity: 0.8;
}

.story-actions {
  display: flex;
  gap: 15px;
}

.action-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 1;
}

.close-btn {
  font-size: 1.5rem;
}

.story-progress {
  display: flex;
  gap: 4px;
  padding: 0 15px;
  margin-bottom: 10px;
  z-index: 2;
}

.progress-bar {
  height: 3px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 1.5px;
  flex: 1;
  overflow: hidden;
}

.progress-bar.viewed .progress-fill {
  width: 100% !important;
}

.progress-fill {
  height: 100%;
  background-color: white;
  border-radius: 1.5px;
  transition: width 0.1s linear;
}

.story-media-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-image, .story-video {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.story-image img, .story-video video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.story-caption {
  position: absolute;
  bottom: 70px;
  left: 0;
  width: 100%;
  padding: 15px;
  color: white;
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent);
  font-size: 0.95rem;
}

.story-sticker {
  position: absolute;
  pointer-events: none;
  max-width: 40%;
}

.story-sticker img {
  max-width: 100%;
  max-height: 100%;
}

.text-sticker {
  padding: 5px 10px;
  border-radius: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: pre-wrap;
  text-align: center;
}

.emoji-sticker {
  font-size: 3rem;
}

.story-reply {
  padding: 15px;
  display: flex;
  gap: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 2;
}

.story-reply input {
  flex: 1;
  padding: 10px 15px;
  border-radius: 20px;
  border: none;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.9rem;
  outline: none;
}

.story-reply input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.send-btn {
  padding: 0 15px;
  border-radius: 20px;
  border: none;
  background-color: #3b82f6;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-btn:hover {
  background-color: #2563eb;
}

.send-btn:disabled {
  background-color: rgba(255, 255, 255, 0.2);
  cursor: not-allowed;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  font-weight: 300;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
  z-index: 2;
}

.nav-btn:hover {
  opacity: 1;
}

.prev-btn {
  left: 10px;
}

.next-btn {
  right: 10px;
}

@media (max-width: 480px) {
  .story-content {
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    border-radius: 0;
  }
  
  .nav-btn {
    opacity: 0.5;
  }
}
</style> 