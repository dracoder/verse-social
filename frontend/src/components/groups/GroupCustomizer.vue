<template>
  <div class="group-customizer">
    <h3 class="section-title">Customize Group Space</h3>
    
    <!-- Theme Selection -->
    <div class="customizer-section">
      <h4>Group Theme</h4>
      <div class="theme-grid">
        <div
          v-for="theme in themes"
          :key="theme.id"
          class="theme-item"
          :class="{ 'active': modelValue.theme === theme.id }"
          @click="updateTheme(theme.id)"
        >
          <div class="theme-preview" :style="getThemePreviewStyle(theme)">
            <div class="theme-name">{{ theme.name }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Background Image -->
    <div class="customizer-section">
      <h4>Group Banner</h4>
      <div class="banner-options">
        <div class="banner-grid">
          <div
            v-for="(image, index) in backgroundImages"
            :key="index"
            class="banner-option"
            :class="{ 'active': modelValue.coverImage === image }"
            :style="{ backgroundImage: `url(${image})` }"
            @click="updateCoverImage(image)"
          ></div>
        </div>
        
        <div class="custom-upload">
          <label for="custom-banner-upload" class="upload-btn">Upload Custom Banner</label>
          <input
            id="custom-banner-upload"
            type="file"
            accept="image/*"
            @change="handleImageUpload"
            class="hidden-input"
          />
        </div>
      </div>
    </div>
    
    <!-- Custom Styles -->
    <div class="customizer-section">
      <h4>Custom Styles</h4>
      
      <div class="style-option">
        <label>Primary Color</label>
        <div class="color-picker-container">
          <input 
            type="color" 
            v-model="modelValue.customStyles.primaryColor" 
            @change="updateModelValue"
          />
          <span>{{ modelValue.customStyles.primaryColor }}</span>
        </div>
      </div>
      
      <div class="style-option">
        <label>Text Color</label>
        <div class="color-picker-container">
          <input 
            type="color" 
            v-model="modelValue.customStyles.textColor" 
            @change="updateModelValue"
          />
          <span>{{ modelValue.customStyles.textColor }}</span>
        </div>
      </div>
      
      <div class="style-option">
        <label>Font Style</label>
        <select v-model="modelValue.customStyles.fontFamily" @change="updateModelValue">
          <option v-for="font in fontOptions" :key="font.value" :value="font.value">
            {{ font.label }}
          </option>
        </select>
      </div>
    </div>
    
    <!-- Group Decorations -->
    <div class="customizer-section">
      <h4>Group Decorations</h4>
      
      <div class="decorations-grid">
        <div
          v-for="(decoration, index) in availableDecorations"
          :key="index"
          class="decoration-item"
          @click="toggleDecoration(decoration.id)"
          :class="{ 'active': isDecorationActive(decoration.id) }"
        >
          <img :src="decoration.imageUrl" :alt="decoration.name" />
          <div class="decoration-name">{{ decoration.name }}</div>
        </div>
      </div>
    </div>
    
    <!-- Custom Emojis -->
    <div class="customizer-section" v-if="modelValue.allowCustomEmojis">
      <h4>Custom Emojis</h4>
      
      <div class="toggle-container">
        <label class="toggle-switch">
          <input type="checkbox" v-model="modelValue.allowCustomEmojis" @change="updateModelValue" />
          <span class="toggle-slider"></span>
        </label>
        <span>Allow Custom Emojis</span>
      </div>
      
      <div v-if="modelValue.allowCustomEmojis" class="emojis-container">
        <div class="emojis-grid">
          <div
            v-for="(emoji, index) in modelValue.customEmojis"
            :key="index"
            class="emoji-item"
          >
            <img :src="emoji.imageUrl" :alt="emoji.name" class="emoji-image" />
            <div class="emoji-info">
              <div class="emoji-name">:{{ emoji.code }}:</div>
              <button class="remove-emoji" @click="removeEmoji(index)">×</button>
            </div>
          </div>
        </div>
        
        <div class="add-emoji-form">
          <div class="form-row">
            <input type="text" v-model="newEmoji.name" placeholder="Emoji name" />
            <input type="text" v-model="newEmoji.code" placeholder="Emoji code (e.g. party)" />
          </div>
          <div class="form-row">
            <input type="file" accept="image/*" @change="handleEmojiUpload" class="emoji-upload" />
            <button class="add-emoji-btn" @click="addEmoji" :disabled="!newEmoji.imageUrl">
              Add Emoji
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="actions">
      <button class="action-button reset" @click="resetCustomization">Reset to Default</button>
      <button class="action-button save" @click="saveCustomization">Save Changes</button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      theme: 'default',
      coverImage: '',
      customStyles: {
        primaryColor: '#3b82f6',
        textColor: '#1f2937',
        fontFamily: 'Inter, sans-serif'
      },
      groupDecorations: [],
      allowCustomEmojis: false,
      customEmojis: []
    })
  }
});

const emit = defineEmits(['update:modelValue', 'save']);

const themes = [
  { id: 'default', name: 'Default', color: '#3b82f6' },
  { id: 'dark', name: 'Dark', color: '#1f2937' },
  { id: 'light', name: 'Light', color: '#f3f4f6' },
  { id: 'purple', name: 'Purple', color: '#8b5cf6' },
  { id: 'green', name: 'Green', color: '#10b981' },
  { id: 'pink', name: 'Pink', color: '#ec4899' },
  { id: 'orange', name: 'Orange', color: '#f59e0b' },
  { id: 'red', name: 'Red', color: '#ef4444' }
];

const backgroundImages = [
  '/images/banners/banner1.jpg',
  '/images/banners/banner2.jpg',
  '/images/banners/banner3.jpg',
  '/images/banners/banner4.jpg',
  '/images/banners/banner5.jpg',
  '/images/banners/banner6.jpg'
];

const fontOptions = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Open Sans', value: 'Open Sans, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Raleway', value: 'Raleway, sans-serif' },
  { label: 'Poppins', value: 'Poppins, sans-serif' }
];

const availableDecorations = [
  { id: 'confetti', name: 'Confetti', imageUrl: '/images/decorations/confetti.png' },
  { id: 'stars', name: 'Stars', imageUrl: '/images/decorations/stars.png' },
  { id: 'lights', name: 'Lights', imageUrl: '/images/decorations/lights.png' },
  { id: 'ribbons', name: 'Ribbons', imageUrl: '/images/decorations/ribbons.png' },
  { id: 'balloons', name: 'Balloons', imageUrl: '/images/decorations/balloons.png' },
  { id: 'flowers', name: 'Flowers', imageUrl: '/images/decorations/flowers.png' }
];

const newEmoji = ref({
  name: '',
  code: '',
  imageUrl: ''
});

const getThemePreviewStyle = (theme) => {
  return {
    backgroundColor: theme.color,
    color: theme.id === 'light' ? '#1f2937' : '#fff'
  };
};

const updateTheme = (themeId) => {
  emit('update:modelValue', {
    ...props.modelValue,
    theme: themeId
  });
};

const updateCoverImage = (imageUrl) => {
  emit('update:modelValue', {
    ...props.modelValue,
    coverImage: imageUrl
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
        coverImage: e.target.result
      });
    };
    reader.readAsDataURL(file);
  }
};

const handleEmojiUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      newEmoji.value.imageUrl = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const isDecorationActive = (decorationId) => {
  return props.modelValue.groupDecorations.includes(decorationId);
};

const toggleDecoration = (decorationId) => {
  let decorations = [...props.modelValue.groupDecorations];
  
  if (isDecorationActive(decorationId)) {
    decorations = decorations.filter(id => id !== decorationId);
  } else {
    decorations.push(decorationId);
  }
  
  emit('update:modelValue', {
    ...props.modelValue,
    groupDecorations: decorations
  });
};

const addEmoji = () => {
  if (newEmoji.value.name && newEmoji.value.code && newEmoji.value.imageUrl) {
    const emojis = [...props.modelValue.customEmojis];
    emojis.push({
      name: newEmoji.value.name,
      code: newEmoji.value.code,
      imageUrl: newEmoji.value.imageUrl
    });
    
    emit('update:modelValue', {
      ...props.modelValue,
      customEmojis: emojis
    });
    
    // Reset the form
    newEmoji.value = {
      name: '',
      code: '',
      imageUrl: ''
    };
  }
};

const removeEmoji = (index) => {
  const emojis = [...props.modelValue.customEmojis];
  emojis.splice(index, 1);
  
  emit('update:modelValue', {
    ...props.modelValue,
    customEmojis: emojis
  });
};

const resetCustomization = () => {
  emit('update:modelValue', {
    theme: 'default',
    coverImage: '',
    customStyles: {
      primaryColor: '#3b82f6',
      textColor: '#1f2937',
      fontFamily: 'Inter, sans-serif'
    },
    groupDecorations: [],
    allowCustomEmojis: false,
    customEmojis: []
  });
};

const saveCustomization = () => {
  emit('save', props.modelValue);
};
</script>

<style scoped>
.group-customizer {
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

.customizer-section {
  margin-bottom: 2rem;
}

.customizer-section h4 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: var(--text-color, #1f2937);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
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
  font-weight: 500;
}

.theme-item.active .theme-preview {
  box-shadow: 0 0 0 3px var(--primary-color, #3b82f6);
}

.banner-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.banner-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.banner-option {
  height: 80px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.banner-option:hover {
  transform: scale(1.03);
}

.banner-option.active {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

.custom-upload {
  margin-top: 15px;
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

.style-option {
  margin-bottom: 15px;
}

.style-option label {
  display: block;
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-picker-container input[type="color"] {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.style-option select {
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid var(--border-color, #e5e7eb);
  font-size: 0.9rem;
}

.decorations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 15px;
}

.decoration-item {
  cursor: pointer;
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.decoration-item:hover {
  background-color: var(--hover-color, #f3f4f6);
}

.decoration-item.active {
  border-color: var(--primary-color, #3b82f6);
  background-color: var(--primary-light, #dbeafe);
}

.decoration-item img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  margin-bottom: 5px;
}

.decoration-name {
  font-size: 0.8rem;
}

.toggle-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: var(--primary-color, #3b82f6);
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.emojis-container {
  margin-top: 15px;
}

.emojis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.emoji-item {
  background-color: var(--bg-alt-color, #f9fafb);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.emoji-image {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.emoji-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.emoji-name {
  font-size: 0.9rem;
  font-family: monospace;
}

.remove-emoji {
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
}

.add-emoji-form {
  background-color: var(--bg-alt-color, #f9fafb);
  padding: 15px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-row {
  display: flex;
  gap: 10px;
}

.form-row input {
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid var(--border-color, #e5e7eb);
  font-size: 0.9rem;
}

.emoji-upload {
  flex: 1;
}

.add-emoji-btn {
  padding: 8px 15px;
  background-color: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.add-emoji-btn:hover {
  background-color: var(--primary-dark, #2563eb);
}

.add-emoji-btn:disabled {
  background-color: var(--gray-color, #6b7280);
  cursor: not-allowed;
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
  .theme-grid, .decorations-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
  
  .banner-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  
  .emojis-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  
  .form-row {
    flex-direction: column;
  }
}
</style> 