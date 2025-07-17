<template>
  <div class="reactions-container">
    <!-- Current reactions display -->
    <div class="reaction-bubbles">
      <transition-group name="bubble">
        <div 
          v-for="(reaction, index) in groupedReactions" 
          :key="reaction.emoji"
          class="reaction-bubble"
          :class="{ 'user-reacted': reaction.userReacted }"
          @click="toggleReaction(reaction.emoji)"
        >
          <span class="reaction-emoji">{{ reaction.emoji }}</span>
          <span class="reaction-count">{{ reaction.count }}</span>
          
          <div 
            v-if="showUserAvatars && reaction.count <= 3" 
            class="reaction-avatars"
          >
            <div 
              v-for="(user, userIndex) in reaction.users.slice(0, 3)" 
              :key="userIndex"
              class="reaction-user-avatar"
              :style="{ backgroundImage: `url(${user.avatar})` }"
              :title="user.name"
            ></div>
          </div>
          
          <div 
            v-if="reaction.isNew" 
            class="reaction-animation"
            :class="animationClass"
          ></div>
        </div>
      </transition-group>
      
      <!-- Add reaction button -->
      <div 
        class="add-reaction-btn"
        @click="toggleEmojiPicker"
        ref="addButton"
      >
        <span v-if="!showEmojiPicker">+</span>
        <span v-else>×</span>
      </div>
    </div>
    
    <!-- Emoji picker -->
    <transition name="scale">
      <div v-if="showEmojiPicker" class="emoji-picker" ref="emojiPicker">
        <div class="emoji-tabs">
          <button 
            v-for="(category, index) in emojiCategories" 
            :key="index"
            class="emoji-tab"
            :class="{ 'active': currentCategory === category.name }"
            @click="currentCategory = category.name"
          >
            <span class="category-icon">{{ category.icon }}</span>
          </button>
        </div>
        
        <div class="emoji-grid">
          <button 
            v-for="(emoji, index) in filteredEmojis" 
            :key="index"
            class="emoji-btn"
            @click="addReaction(emoji)"
            :title="emoji.name"
          >
            {{ emoji.symbol }}
          </button>
        </div>
        
        <div v-if="allowCustomEmojis" class="custom-emojis">
          <div class="section-title">Custom</div>
          <div class="emoji-grid">
            <button 
              v-for="(emoji, index) in customEmojis" 
              :key="`custom-${index}`"
              class="emoji-btn custom"
              @click="addReaction(emoji.symbol)"
            >
              <img 
                :src="emoji.url" 
                :alt="emoji.name" 
                class="custom-emoji-img"
              />
            </button>
          </div>
        </div>
        
        <div class="frequently-used">
          <div class="section-title">Frequently Used</div>
          <div class="emoji-grid">
            <button 
              v-for="(emoji, index) in frequentlyUsed" 
              :key="`frequent-${index}`"
              class="emoji-btn"
              @click="addReaction(emoji)"
            >
              {{ emoji }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  allowCustomEmojis: {
    type: Boolean,
    default: false
  },
  customEmojis: {
    type: Array,
    default: () => []
  },
  userId: {
    type: [Number, String],
    required: true
  },
  animationStyle: {
    type: String,
    default: 'pop', // pop, burst, float, pulse
    validator: (val) => ['pop', 'burst', 'float', 'pulse'].includes(val)
  },
  showUserAvatars: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue', 'reaction-added', 'reaction-removed']);

// State
const showEmojiPicker = ref(false);
const currentCategory = ref('smileys');
const newReactions = ref(new Set());
const addButton = ref(null);
const emojiPicker = ref(null);
const frequentlyUsed = ref(['👍', '❤️', '😂', '😮', '😢', '👏']);

// Emoji categories
const emojiCategories = [
  { name: 'smileys', icon: '😊', emojis: [
    { symbol: '😀', name: 'Grinning Face' },
    { symbol: '😃', name: 'Grinning Face with Big Eyes' },
    { symbol: '😄', name: 'Grinning Face with Smiling Eyes' },
    { symbol: '😁', name: 'Beaming Face with Smiling Eyes' },
    { symbol: '😆', name: 'Grinning Squinting Face' },
    { symbol: '😅', name: 'Grinning Face with Sweat' },
    { symbol: '🤣', name: 'Rolling on the Floor Laughing' },
    { symbol: '😂', name: 'Face with Tears of Joy' },
    { symbol: '🙂', name: 'Slightly Smiling Face' },
    { symbol: '🙃', name: 'Upside-Down Face' },
    { symbol: '😉', name: 'Winking Face' },
    { symbol: '😊', name: 'Smiling Face with Smiling Eyes' },
    { symbol: '😇', name: 'Smiling Face with Halo' },
    { symbol: '🥰', name: 'Smiling Face with Hearts' },
    { symbol: '😍', name: 'Smiling Face with Heart-Eyes' },
    { symbol: '🤩', name: 'Star-Struck' },
    { symbol: '😘', name: 'Face Blowing a Kiss' },
    { symbol: '😗', name: 'Kissing Face' },
    { symbol: '☺️', name: 'Smiling Face' },
    { symbol: '😚', name: 'Kissing Face with Closed Eyes' }
  ]},
  { name: 'people', icon: '👨', emojis: [
    { symbol: '👋', name: 'Waving Hand' },
    { symbol: '🤚', name: 'Raised Back of Hand' },
    { symbol: '🖐️', name: 'Hand with Fingers Splayed' },
    { symbol: '✋', name: 'Raised Hand' },
    { symbol: '🖖', name: 'Vulcan Salute' },
    { symbol: '👌', name: 'OK Hand' },
    { symbol: '🤌', name: 'Pinched Fingers' },
    { symbol: '🤏', name: 'Pinching Hand' },
    { symbol: '✌️', name: 'Victory Hand' },
    { symbol: '🤞', name: 'Crossed Fingers' }
  ]},
  { name: 'nature', icon: '🌿', emojis: [
    { symbol: '🐶', name: 'Dog Face' },
    { symbol: '🐱', name: 'Cat Face' },
    { symbol: '🐭', name: 'Mouse Face' },
    { symbol: '🐹', name: 'Hamster Face' },
    { symbol: '🐰', name: 'Rabbit Face' },
    { symbol: '🦊', name: 'Fox Face' },
    { symbol: '🐻', name: 'Bear Face' },
    { symbol: '🐼', name: 'Panda Face' },
    { symbol: '🦁', name: 'Lion Face' },
    { symbol: '🐮', name: 'Cow Face' }
  ]},
  { name: 'food', icon: '🍔', emojis: [
    { symbol: '🍎', name: 'Red Apple' },
    { symbol: '🍐', name: 'Pear' },
    { symbol: '🍊', name: 'Tangerine' },
    { symbol: '🍋', name: 'Lemon' },
    { symbol: '🍌', name: 'Banana' },
    { symbol: '🍉', name: 'Watermelon' },
    { symbol: '🍇', name: 'Grapes' },
    { symbol: '🍓', name: 'Strawberry' },
    { symbol: '🫐', name: 'Blueberries' },
    { symbol: '🍈', name: 'Melon' }
  ]},
  { name: 'activities', icon: '⚽', emojis: [
    { symbol: '⚽', name: 'Soccer Ball' },
    { symbol: '🏀', name: 'Basketball' },
    { symbol: '🏈', name: 'American Football' },
    { symbol: '⚾', name: 'Baseball' },
    { symbol: '🥎', name: 'Softball' },
    { symbol: '🎾', name: 'Tennis' },
    { symbol: '🏐', name: 'Volleyball' },
    { symbol: '🏉', name: 'Rugby Football' },
    { symbol: '🥏', name: 'Flying Disc' },
    { symbol: '🎱', name: 'Pool 8 Ball' }
  ]},
  { name: 'travel', icon: '✈️', emojis: [
    { symbol: '🚗', name: 'Car' },
    { symbol: '🚕', name: 'Taxi' },
    { symbol: '🚙', name: 'Sport Utility Vehicle' },
    { symbol: '🚌', name: 'Bus' },
    { symbol: '🚎', name: 'Trolleybus' },
    { symbol: '🏎️', name: 'Racing Car' },
    { symbol: '🚓', name: 'Police Car' },
    { symbol: '🚑', name: 'Ambulance' },
    { symbol: '🚒', name: 'Fire Engine' },
    { symbol: '🚐', name: 'Minibus' }
  ]},
  { name: 'symbols', icon: '💯', emojis: [
    { symbol: '❤️', name: 'Red Heart' },
    { symbol: '🧡', name: 'Orange Heart' },
    { symbol: '💛', name: 'Yellow Heart' },
    { symbol: '💚', name: 'Green Heart' },
    { symbol: '💙', name: 'Blue Heart' },
    { symbol: '💜', name: 'Purple Heart' },
    { symbol: '🖤', name: 'Black Heart' },
    { symbol: '🤍', name: 'White Heart' },
    { symbol: '🤎', name: 'Brown Heart' },
    { symbol: '💔', name: 'Broken Heart' }
  ]}
];

// Computed properties
const filteredEmojis = computed(() => {
  const category = emojiCategories.find(cat => cat.name === currentCategory.value);
  return category ? category.emojis : [];
});

const groupedReactions = computed(() => {
  // Group reactions by emoji
  const groups = {};
  
  props.modelValue.forEach(reaction => {
    const emoji = reaction.emoji;
    if (!groups[emoji]) {
      groups[emoji] = {
        emoji,
        count: 0,
        users: [],
        userReacted: false,
        isNew: newReactions.value.has(emoji)
      };
    }
    
    groups[emoji].count++;
    groups[emoji].users.push(reaction.user);
    
    if (reaction.userId === props.userId) {
      groups[emoji].userReacted = true;
    }
  });
  
  // Convert to array and sort by count (descending)
  return Object.values(groups).sort((a, b) => b.count - a.count);
});

const animationClass = computed(() => {
  return `animation-${props.animationStyle}`;
});

// Methods
const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
};

const addReaction = (emoji) => {
  const emojiSymbol = typeof emoji === 'string' ? emoji : emoji.symbol;
  
  // Check if user already reacted with this emoji
  const existingReaction = props.modelValue.find(r => 
    r.emoji === emojiSymbol && r.userId === props.userId
  );
  
  if (existingReaction) {
    // Remove the reaction
    const updatedReactions = props.modelValue.filter(r => 
      !(r.emoji === emojiSymbol && r.userId === props.userId)
    );
    emit('update:modelValue', updatedReactions);
    emit('reaction-removed', emojiSymbol);
  } else {
    // Add the reaction
    const newReaction = {
      emoji: emojiSymbol,
      userId: props.userId,
      timestamp: new Date().toISOString(),
      user: {
        id: props.userId,
        name: 'Current User', // This would typically come from a user store
        avatar: '/images/avatars/default.png'
      }
    };
    
    const updatedReactions = [...props.modelValue, newReaction];
    emit('update:modelValue', updatedReactions);
    emit('reaction-added', emojiSymbol);
    
    // Mark as new for animation
    newReactions.value.add(emojiSymbol);
    setTimeout(() => {
      newReactions.value.delete(emojiSymbol);
    }, 2000);
    
    // Add to frequently used
    if (!frequentlyUsed.value.includes(emojiSymbol)) {
      frequentlyUsed.value.unshift(emojiSymbol);
      frequentlyUsed.value = frequentlyUsed.value.slice(0, 6);
    }
  }
  
  // Close the emoji picker
  showEmojiPicker.value = false;
};

const toggleReaction = (emoji) => {
  addReaction(emoji);
};

// Handle clicks outside the emoji picker to close it
const handleClickOutside = (event) => {
  if (
    showEmojiPicker.value && 
    emojiPicker.value && 
    !emojiPicker.value.contains(event.target) &&
    addButton.value && 
    !addButton.value.contains(event.target)
  ) {
    showEmojiPicker.value = false;
  }
};

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.reactions-container {
  position: relative;
  margin: 10px 0;
}

.reaction-bubbles {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.reaction-bubble {
  display: flex;
  align-items: center;
  background-color: var(--bubble-bg, rgba(0, 0, 0, 0.05));
  border-radius: 20px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.reaction-bubble:hover {
  background-color: var(--bubble-hover-bg, rgba(0, 0, 0, 0.1));
  transform: scale(1.05);
}

.reaction-bubble.user-reacted {
  background-color: var(--bubble-active-bg, rgba(59, 130, 246, 0.1));
  border: 1px solid var(--bubble-active-border, rgba(59, 130, 246, 0.3));
}

.reaction-emoji {
  font-size: 1.1rem;
  margin-right: 5px;
}

.reaction-count {
  font-size: 0.85rem;
  color: var(--text-muted, #6b7280);
  font-weight: 500;
}

.reaction-avatars {
  display: flex;
  margin-left: 5px;
}

.reaction-user-avatar {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  border: 1px solid white;
  margin-left: -5px;
}

.reaction-user-avatar:first-child {
  margin-left: 0;
}

.add-reaction-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--bg-alt-color, #f3f4f6);
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
  border: 1px dashed var(--border-color, #d1d5db);
}

.add-reaction-btn:hover {
  background-color: var(--hover-color, #e5e7eb);
  transform: scale(1.1);
}

.emoji-picker {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  width: 320px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.emoji-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  background-color: var(--bg-alt-color, #f9fafb);
}

.emoji-tab {
  flex: 1;
  padding: 10px;
  text-align: center;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.emoji-tab:hover {
  background-color: var(--hover-color, rgba(0, 0, 0, 0.05));
}

.emoji-tab.active {
  background-color: white;
  position: relative;
}

.emoji-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--primary-color, #3b82f6);
}

.category-icon {
  font-size: 1.2rem;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 5px;
  padding: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.emoji-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.emoji-btn:hover {
  background-color: var(--hover-color, rgba(0, 0, 0, 0.05));
  transform: scale(1.15);
}

.emoji-btn.custom {
  padding: 3px;
}

.custom-emoji-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.section-title {
  padding: 5px 10px;
  font-size: 0.85rem;
  color: var(--text-muted, #6b7280);
  background-color: var(--bg-alt-color, #f9fafb);
  border-top: 1px solid var(--border-color, #e5e7eb);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.custom-emojis, .frequently-used {
  margin-top: 5px;
}

.reaction-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.animation-pop {
  animation: pop 1s ease;
}

.animation-burst::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, transparent 70%);
  transform: translate(-50%, -50%) scale(0);
  border-radius: 50%;
  animation: burst 1s ease;
}

.animation-float {
  overflow: visible;
}

.animation-float::after {
  content: '•';
  position: absolute;
  top: 0;
  left: 50%;
  color: transparent;
  font-size: 0;
  animation: float 1.5s ease;
}

.animation-pulse {
  animation: pulse 1s ease;
}

/* Animation keyframes */
@keyframes pop {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes burst {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.7; }
  100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
}

@keyframes float {
  0% { 
    top: 0; 
    left: 50%; 
    transform: translateX(-50%);
    opacity: 0;
    font-size: 1.5rem;
  }
  10% { 
    opacity: 1; 
    font-size: 1.5rem;
  }
  100% { 
    top: -30px; 
    left: 50%; 
    transform: translateX(-50%);
    opacity: 0;
    font-size: 1.8rem;
  }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
  100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}

/* Transition animations */
.bubble-enter-active, .bubble-leave-active {
  transition: all 0.3s ease;
}
.bubble-enter-from, .bubble-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

.scale-enter-active, .scale-leave-active {
  transition: all 0.2s ease;
  transform-origin: top left;
}
.scale-enter-from, .scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@media (max-width: 768px) {
  .emoji-picker {
    width: 280px;
  }
  
  .emoji-grid {
    grid-template-columns: repeat(6, 1fr);
  }
  
  .emoji-btn {
    width: 36px;
    height: 36px;
  }
}
</style> 