<template>
  <div class="profile-decorations">
    <h3 class="section-title">Profile Decorations</h3>
    
    <!-- Theme Selection -->
    <div class="decoration-section">
      <h4>Profile Theme</h4>
      <div class="theme-grid">
        <div
          v-for="theme in themes"
          :key="theme.id"
          class="theme-item"
          :class="{ 'active': modelValue.theme === theme.id }"
          @click="updateTheme(theme.id)"
        >
          <div class="theme-preview" :style="getThemePreviewStyle(theme)">
            <div class="theme-circle"></div>
          </div>
          <div class="theme-name">{{ theme.name }}</div>
        </div>
      </div>
    </div>
    
    <!-- Background Settings -->
    <div class="decoration-section">
      <h4>Background</h4>
      <div class="background-options">
        <div class="option-group">
          <label>
            <input
              type="radio"
              v-model="modelValue.backgroundType"
              value="solid"
              @change="updateModelValue"
            />
            Solid Color
          </label>
          <div v-if="modelValue.backgroundType === 'solid'" class="color-picker-container">
            <input
              type="color"
              v-model="modelValue.backgroundColor"
              @change="updateModelValue"
            />
            <span>{{ modelValue.backgroundColor }}</span>
          </div>
        </div>
        
        <div class="option-group">
          <label>
            <input
              type="radio"
              v-model="modelValue.backgroundType"
              value="image"
              @change="updateModelValue"
            />
            Image
          </label>
          <div v-if="modelValue.backgroundType === 'image'" class="bg-image-selector">
            <div class="image-grid">
              <div
                v-for="(image, index) in backgroundImages"
                :key="index"
                class="image-option"
                :class="{ 'active': modelValue.backgroundImage === image }"
                :style="{ backgroundImage: `url(${image})` }"
                @click="updateBackgroundImage(image)"
              ></div>
            </div>
            <div class="custom-upload">
              <label for="custom-bg-upload" class="upload-btn">Upload Custom Image</label>
              <input
                id="custom-bg-upload"
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                class="hidden-input"
              />
            </div>
          </div>
        </div>
        
        <div class="option-group">
          <label>
            <input
              type="radio"
              v-model="modelValue.backgroundType"
              value="animated"
              @change="updateModelValue"
            />
            Animated Background
          </label>
          <div v-if="modelValue.backgroundType === 'animated'" class="animation-selector">
            <div class="animation-grid">
              <div
                v-for="(anim, index) in animatedBackgrounds"
                :key="index"
                class="animation-option"
                :class="{ 'active': modelValue.animatedBackground === anim.id }"
                @click="updateAnimatedBackground(anim.id)"
              >
                <div class="animation-preview" :class="anim.previewClass"></div>
                <div class="animation-name">{{ anim.name }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Stickers & Widgets -->
    <div class="decoration-section">
      <h4>Stickers & Widgets</h4>
      <div class="stickers-container">
        <div class="stickers-grid">
          <div
            v-for="(sticker, index) in availableStickers"
            :key="index"
            class="sticker-item"
            @click="addSticker(sticker)"
          >
            <img :src="sticker.imageUrl" :alt="sticker.name" />
          </div>
        </div>
        
        <div class="widgets-grid">
          <div
            v-for="(widget, index) in availableWidgets"
            :key="index"
            class="widget-item"
            @click="addWidget(widget)"
          >
            <div class="widget-preview">
              <div class="widget-icon">{{ widget.icon }}</div>
              <div class="widget-name">{{ widget.name }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="active-items">
        <h5>Your Items ({{ modelValue.profileDecorations.length }})</h5>
        <div class="active-items-list">
          <div 
            v-for="(item, index) in modelValue.profileDecorations" 
            :key="index"
            class="active-item"
          >
            <img v-if="item.type === 'sticker'" :src="item.imageUrl" :alt="item.name" class="item-preview" />
            <div v-else class="widget-preview">
              <div class="widget-icon">{{ item.icon }}</div>
            </div>
            <div class="item-name">{{ item.name }}</div>
            <button class="remove-item" @click="removeItem(index)">×</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Mood Indicator -->
    <div class="decoration-section">
      <h4>Mood Indicator</h4>
      <div class="mood-selector">
        <div
          v-for="(mood, index) in moods"
          :key="index"
          class="mood-option"
          :class="{ 'active': modelValue.mood === mood.id }"
          @click="updateMood(mood.id)"
        >
          <div class="mood-emoji">{{ mood.emoji }}</div>
          <div class="mood-name">{{ mood.name }}</div>
        </div>
      </div>
    </div>
    
    <!-- Font Style -->
    <div class="decoration-section">
      <h4>Font Style</h4>
      <select v-model="modelValue.fontStyle" @change="updateModelValue" class="font-select">
        <option v-for="font in fontStyles" :key="font.id" :value="font.id">
          {{ font.name }}
        </option>
      </select>
    </div>
    
    <div class="actions">
      <button class="action-button reset" @click="resetDecorations">Reset to Default</button>
      <button class="action-button save" @click="saveDecorations">Save Changes</button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      theme: 'default',
      backgroundType: 'solid',
      backgroundColor: '#f0f2f5',
      backgroundImage: '',
      animatedBackground: '',
      profileDecorations: [],
      mood: 'neutral',
      fontStyle: 'default'
    })
  }
});

const emit = defineEmits(['update:modelValue', 'save']);

const themes = [
  { id: 'default', name: 'Default', mainColor: '#6366f1' },
  { id: 'dark', name: 'Dark', mainColor: '#1f2937' },
  { id: 'light', name: 'Light', mainColor: '#f3f4f6' },
  { id: 'purple', name: 'Purple', mainColor: '#8b5cf6' },
  { id: 'blue', name: 'Blue', mainColor: '#3b82f6' },
  { id: 'green', name: 'Green', mainColor: '#10b981' },
  { id: 'pink', name: 'Pink', mainColor: '#ec4899' },
  { id: 'orange', name: 'Orange', mainColor: '#f59e0b' },
  { id: 'red', name: 'Red', mainColor: '#ef4444' }
];

const backgroundImages = [
  '/images/backgrounds/bg1.jpg',
  '/images/backgrounds/bg2.jpg',
  '/images/backgrounds/bg3.jpg',
  '/images/backgrounds/bg4.jpg',
  '/images/backgrounds/bg5.jpg',
  '/images/backgrounds/bg6.jpg'
];

const animatedBackgrounds = [
  { id: 'particles', name: 'Particles', previewClass: 'preview-particles' },
  { id: 'waves', name: 'Waves', previewClass: 'preview-waves' },
  { id: 'bubbles', name: 'Bubbles', previewClass: 'preview-bubbles' },
  { id: 'stars', name: 'Stars', previewClass: 'preview-stars' },
  { id: 'confetti', name: 'Confetti', previewClass: 'preview-confetti' },
  { id: 'gradients', name: 'Gradients', previewClass: 'preview-gradients' }
];

const availableStickers = [
  { type: 'sticker', id: 'star', name: 'Star', imageUrl: '/images/stickers/star.png' },
  { type: 'sticker', id: 'heart', name: 'Heart', imageUrl: '/images/stickers/heart.png' },
  { type: 'sticker', id: 'flower', name: 'Flower', imageUrl: '/images/stickers/flower.png' },
  { type: 'sticker', id: 'planet', name: 'Planet', imageUrl: '/images/stickers/planet.png' },
  { type: 'sticker', id: 'rainbow', name: 'Rainbow', imageUrl: '/images/stickers/rainbow.png' },
  { type: 'sticker', id: 'diamond', name: 'Diamond', imageUrl: '/images/stickers/diamond.png' },
  { type: 'sticker', id: 'music', name: 'Music', imageUrl: '/images/stickers/music.png' },
  { type: 'sticker', id: 'cat', name: 'Cat', imageUrl: '/images/stickers/cat.png' }
];

const availableWidgets = [
  { type: 'widget', id: 'about', name: 'About Me', icon: '👤' },
  { type: 'widget', id: 'quotes', name: 'Favorite Quote', icon: '💬' },
  { type: 'widget', id: 'music', name: 'Music Player', icon: '🎵' },
  { type: 'widget', id: 'calendar', name: 'Calendar', icon: '📅' },
  { type: 'widget', id: 'links', name: 'Social Links', icon: '🔗' },
  { type: 'widget', id: 'weather', name: 'Weather', icon: '☁️' }
];

const moods = [
  { id: 'happy', name: 'Happy', emoji: '😊' },
  { id: 'neutral', name: 'Neutral', emoji: '😐' },
  { id: 'sad', name: 'Sad', emoji: '😔' },
  { id: 'excited', name: 'Excited', emoji: '🤩' },
  { id: 'relaxed', name: 'Relaxed', emoji: '😌' },
  { id: 'busy', name: 'Busy', emoji: '😤' },
  { id: 'creative', name: 'Creative', emoji: '🎨' },
  { id: 'adventurous', name: 'Adventurous', emoji: '🚀' }
];

const fontStyles = [
  { id: 'default', name: 'Default' },
  { id: 'elegant', name: 'Elegant' },
  { id: 'playful', name: 'Playful' },
  { id: 'tech', name: 'Tech' },
  { id: 'retro', name: 'Retro' },
  { id: 'minimal', name: 'Minimal' }
];

const getThemePreviewStyle = (theme) => {
  return {
    backgroundColor: theme.mainColor,
    border: props.modelValue.theme === theme.id ? '3px solid #fff' : '1px solid #ccc'
  };
};

const updateTheme = (themeId) => {
  emit('update:modelValue', {
    ...props.modelValue,
    theme: themeId
  });
};

const updateBackgroundImage = (imageUrl) => {
  emit('update:modelValue', {
    ...props.modelValue,
    backgroundImage: imageUrl
  });
};

const updateAnimatedBackground = (animId) => {
  emit('update:modelValue', {
    ...props.modelValue,
    animatedBackground: animId
  });
};

const updateMood = (moodId) => {
  emit('update:modelValue', {
    ...props.modelValue,
    mood: moodId
  });
};

const updateModelValue = () => {
  emit('update:modelValue', props.modelValue);
};

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      emit('update:modelValue', {
        ...props.modelValue,
        backgroundImage: e.target.result
      });
    };
    reader.readAsDataURL(file);
  }
};

const addSticker = (sticker) => {
  const decorations = [...props.modelValue.profileDecorations];
  decorations.push({...sticker});
  emit('update:modelValue', {
    ...props.modelValue,
    profileDecorations: decorations
  });
};

const addWidget = (widget) => {
  const decorations = [...props.modelValue.profileDecorations];
  decorations.push({...widget});
  emit('update:modelValue', {
    ...props.modelValue,
    profileDecorations: decorations
  });
};

const removeItem = (index) => {
  const decorations = [...props.modelValue.profileDecorations];
  decorations.splice(index, 1);
  emit('update:modelValue', {
    ...props.modelValue,
    profileDecorations: decorations
  });
};

const resetDecorations = () => {
  emit('update:modelValue', {
    theme: 'default',
    backgroundType: 'solid',
    backgroundColor: '#f0f2f5',
    backgroundImage: '',
    animatedBackground: '',
    profileDecorations: [],
    mood: 'neutral',
    fontStyle: 'default'
  });
};

const saveDecorations = () => {
  emit('save', props.modelValue);
};
</script>

<style scoped>
.profile-decorations {
  background-color: var(--bg-color, #fff);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--text-color, #1f2937);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  padding-bottom: 10px;
}

.decoration-section {
  margin-bottom: 2rem;
}

.decoration-section h4 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: var(--text-color, #1f2937);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 15px;
}

.theme-item {
  cursor: pointer;
  text-align: center;
  transition: transform 0.2s;
}

.theme-item:hover {
  transform: translateY(-3px);
}

.theme-preview {
  height: 60px;
  border-radius: 8px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: white;
}

.theme-name {
  font-size: 0.85rem;
}

.theme-item.active .theme-preview {
  box-shadow: 0 0 0 3px var(--primary-color, #3b82f6);
}

.background-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.option-group {
  padding: 10px;
  border-radius: 8px;
  background-color: var(--bg-alt-color, #f9fafb);
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding-left: 20px;
}

.color-picker-container input[type="color"] {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.bg-image-selector, .animation-selector {
  margin-top: 10px;
  padding-left: 20px;
}

.image-grid, .animation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
}

.image-option {
  height: 70px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.image-option:hover {
  transform: scale(1.05);
}

.image-option.active {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

.animation-option {
  text-align: center;
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  transition: all 0.2s;
}

.animation-option:hover {
  background-color: var(--hover-color, #f3f4f6);
}

.animation-option.active {
  background-color: var(--primary-light, #dbeafe);
}

.animation-preview {
  height: 50px;
  border-radius: 8px;
  margin-bottom: 5px;
  background-color: #ddd;
  overflow: hidden;
}

.preview-particles {
  background-image: url('/images/previews/particles.gif');
  background-size: cover;
}

.preview-waves {
  background-image: url('/images/previews/waves.gif');
  background-size: cover;
}

.preview-bubbles {
  background-image: url('/images/previews/bubbles.gif');
  background-size: cover;
}

.preview-stars {
  background-image: url('/images/previews/stars.gif');
  background-size: cover;
}

.preview-confetti {
  background-image: url('/images/previews/confetti.gif');
  background-size: cover;
}

.preview-gradients {
  background-image: url('/images/previews/gradients.gif');
  background-size: cover;
}

.custom-upload {
  margin-top: 10px;
}

.upload-btn {
  display: inline-block;
  padding: 8px 15px;
  background-color: var(--primary-color, #3b82f6);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.upload-btn:hover {
  background-color: var(--primary-dark, #2563eb);
}

.hidden-input {
  display: none;
}

.stickers-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stickers-grid, .widgets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 15px;
}

.sticker-item, .widget-item {
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  border-radius: 8px;
  padding: 10px;
}

.sticker-item:hover, .widget-item:hover {
  background-color: var(--hover-color, #f3f4f6);
  transform: translateY(-2px);
}

.sticker-item img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.widget-preview {
  height: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-alt-color, #f9fafb);
  border-radius: 8px;
  margin-bottom: 5px;
}

.widget-icon {
  font-size: 1.5rem;
}

.widget-name, .item-name {
  font-size: 0.8rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.active-items {
  margin-top: 20px;
  padding: 15px;
  border-radius: 8px;
  background-color: var(--bg-alt-color, #f9fafb);
}

.active-items h5 {
  margin-bottom: 10px;
  font-size: 0.9rem;
  color: var(--text-color, #1f2937);
}

.active-items-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.active-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: white;
  padding: 5px 10px 5px 5px;
  border-radius: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.item-preview {
  width: 25px;
  height: 25px;
}

.remove-item {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: var(--danger-color, #ef4444);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.remove-item:hover {
  background-color: var(--danger-dark, #dc2626);
}

.mood-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 15px;
}

.mood-option {
  cursor: pointer;
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  transition: all 0.2s;
}

.mood-option:hover {
  background-color: var(--hover-color, #f3f4f6);
}

.mood-option.active {
  background-color: var(--primary-light, #dbeafe);
}

.mood-emoji {
  font-size: 2rem;
  margin-bottom: 5px;
}

.mood-name {
  font-size: 0.8rem;
}

.font-select {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #e5e7eb);
  background-color: white;
  font-size: 0.9rem;
  color: var(--text-color, #1f2937);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 2rem;
}

.action-button {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.reset {
  background-color: var(--gray-color, #6b7280);
  color: white;
}

.reset:hover {
  background-color: var(--gray-dark, #4b5563);
}

.save {
  background-color: var(--primary-color, #3b82f6);
  color: white;
}

.save:hover {
  background-color: var(--primary-dark, #2563eb);
}

@media (max-width: 768px) {
  .theme-grid, .stickers-grid, .widgets-grid, .mood-selector {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  }
  
  .image-grid, .animation-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
}
</style> 