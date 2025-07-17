<template>
  <div class="animated-avatar-container" :class="{ 'is-interactive': interactive }">
    <div class="avatar-frame" :class="[`frame-${frame}`]">
      <div 
        class="avatar-image" 
        :style="{ 
          backgroundImage: `url(${avatarUrl || defaultAvatar})`,
          borderColor: borderColor
        }"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @click="handleClick"
      ></div>
      
      <div v-if="showStatus" class="status-indicator" :class="[`status-${status}`]"></div>
      
      <transition name="badge-fade">
        <div v-if="showBadge" class="avatar-badge">
          <img :src="badgeIcon" alt="Badge" class="badge-icon" />
        </div>
      </transition>
      
      <div v-if="effect" class="avatar-effect" :class="[`effect-${effect}`]"></div>
    </div>
    
    <div v-if="interactive && showControls" class="avatar-controls">
      <div class="frames-selector">
        <button 
          v-for="(frameName, idx) in availableFrames" 
          :key="idx"
          class="frame-option"
          :class="{ 'active': frame === frameName }"
          @click="selectFrame(frameName)"
        >
          <span class="frame-preview" :class="[`preview-${frameName}`]"></span>
        </button>
      </div>
      
      <div class="effects-selector">
        <button 
          v-for="(effectName, idx) in availableEffects" 
          :key="idx"
          class="effect-option"
          :class="{ 'active': effect === effectName }"
          @click="selectEffect(effectName)"
        >
          <span class="effect-icon" :class="[`icon-${effectName}`]"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  avatarUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'offline', // offline, online, busy, away
    validator: (val) => ['offline', 'online', 'busy', 'away'].includes(val)
  },
  showStatus: {
    type: Boolean,
    default: true
  },
  frame: {
    type: String,
    default: 'none'
  },
  effect: {
    type: String,
    default: ''
  },
  badge: {
    type: String,
    default: ''
  },
  interactive: {
    type: Boolean,
    default: false
  },
  borderColor: {
    type: String,
    default: '#3b82f6'
  }
});

const emit = defineEmits(['frame-change', 'effect-change', 'avatar-click']);

// State
const showControls = ref(false);
const currentFrame = ref(props.frame);
const currentEffect = ref(props.effect);
const isHovered = ref(false);

// Computed properties
const defaultAvatar = computed(() => '/images/avatars/default.png');
const showBadge = computed(() => !!props.badge);
const badgeIcon = computed(() => props.badge ? `/images/badges/${props.badge}.png` : '');

const availableFrames = ref([
  'none',
  'simple',
  'fancy',
  'glowing',
  'animated',
  'seasonal'
]);

const availableEffects = ref([
  'none',
  'sparkle',
  'pulse',
  'rainbow',
  'fire',
  'confetti'
]);

// Methods
const handleMouseEnter = () => {
  isHovered.value = true;
  if (props.interactive) {
    showControls.value = true;
  }
};

const handleMouseLeave = () => {
  isHovered.value = false;
  if (props.interactive) {
    // Slight delay before hiding controls
    setTimeout(() => {
      if (!isHovered.value) {
        showControls.value = false;
      }
    }, 500);
  }
};

const handleClick = () => {
  emit('avatar-click');
};

const selectFrame = (frameName) => {
  currentFrame.value = frameName;
  emit('frame-change', frameName);
};

const selectEffect = (effectName) => {
  currentEffect.value = effectName;
  emit('effect-change', effectName);
};

// Watchers
watch(() => props.frame, (newFrame) => {
  currentFrame.value = newFrame;
});

watch(() => props.effect, (newEffect) => {
  currentEffect.value = newEffect;
});
</script>

<style scoped>
.animated-avatar-container {
  position: relative;
  display: inline-block;
  margin: 10px;
}

.avatar-frame {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  border: 3px solid;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.is-interactive .avatar-image:hover {
  transform: scale(1.05);
  cursor: pointer;
}

.status-indicator {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-offline { background-color: #9ca3af; }
.status-online { background-color: #10b981; }
.status-busy { background-color: #ef4444; }
.status-away { background-color: #f59e0b; }

.avatar-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 30px;
  height: 30px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.badge-icon {
  width: 20px;
  height: 20px;
}

.avatar-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  pointer-events: none;
}

.frame-simple {
  padding: 3px;
  background-color: white;
  border-radius: 50%;
}

.frame-fancy {
  padding: 5px;
  background: linear-gradient(45deg, #f3f4f6, #d1d5db);
  border-radius: 50%;
}

.frame-glowing {
  padding: 3px;
  background: linear-gradient(45deg, #3b82f6, #2563eb);
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
}

.frame-animated {
  padding: 3px;
  background-image: linear-gradient(90deg, #3b82f6, #2563eb, #10b981, #3b82f6);
  background-size: 300% 100%;
  border-radius: 50%;
  animation: gradientShift 3s infinite linear;
}

.frame-seasonal {
  padding: 3px;
  background-image: url('/images/frames/seasonal-pattern.png');
  background-size: cover;
  border-radius: 50%;
}

.effect-sparkle::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: url('/images/effects/sparkle.gif');
  background-size: cover;
  opacity: 0.7;
  pointer-events: none;
}

.effect-pulse {
  animation: pulse 2s infinite;
}

.effect-rainbow::before {
  content: '';
  position: absolute;
  width: 110%;
  height: 110%;
  top: -5%;
  left: -5%;
  background: linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet);
  border-radius: 50%;
  z-index: -1;
  animation: rotate 3s linear infinite;
}

.effect-fire::before {
  content: '';
  position: absolute;
  width: 120%;
  height: 120%;
  top: -10%;
  left: -10%;
  background-image: url('/images/effects/fire.gif');
  background-size: cover;
  opacity: 0.7;
  pointer-events: none;
}

.effect-confetti::before {
  content: '';
  position: absolute;
  width: 150%;
  height: 150%;
  top: -25%;
  left: -25%;
  background-image: url('/images/effects/confetti.gif');
  background-size: cover;
  opacity: 0.7;
  pointer-events: none;
}

.avatar-controls {
  position: absolute;
  top: 110%;
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  width: 200px;
  z-index: 10;
  animation: fadeIn 0.2s ease;
}

.frames-selector, .effects-selector {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 10px;
}

.frames-selector:not(:last-child) {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 10px;
}

.frame-option, .effect-option {
  width: 25px;
  height: 25px;
  margin: 3px;
  border-radius: 50%;
  border: 1px solid #e5e7eb;
  background-color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.frame-option:hover, .effect-option:hover {
  transform: scale(1.1);
}

.frame-option.active, .effect-option.active {
  border: 2px solid #3b82f6;
}

.frame-preview, .effect-icon {
  width: 15px;
  height: 15px;
  border-radius: 50%;
}

.preview-none { background-color: transparent; }
.preview-simple { background-color: #f3f4f6; }
.preview-fancy { background: linear-gradient(45deg, #f3f4f6, #d1d5db); }
.preview-glowing { background: linear-gradient(45deg, #3b82f6, #2563eb); }
.preview-animated { background: linear-gradient(90deg, #3b82f6, #2563eb, #10b981); }
.preview-seasonal { background-color: #f59e0b; }

.icon-none { display: none; }
.icon-sparkle { background-color: yellow; }
.icon-pulse { background-color: #3b82f6; animation: pulse 2s infinite; }
.icon-rainbow { background: linear-gradient(90deg, red, violet); }
.icon-fire { background-color: #ef4444; }
.icon-confetti { background: radial-gradient(circle, #3b82f6, #10b981, #f59e0b); }

.badge-fade-enter-active, .badge-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.badge-fade-enter-from, .badge-fade-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}

@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, 10px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

@media (max-width: 768px) {
  .avatar-frame {
    width: 80px;
    height: 80px;
  }
  
  .avatar-controls {
    width: 160px;
  }
  
  .frame-option, .effect-option {
    width: 20px;
    height: 20px;
  }
}
</style> 