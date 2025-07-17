<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      theme: 'default',
      accent_color: '#646cff',
      font_size: 'medium',
      layout: 'standard'
    })
  },
  showPreview: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue']);

const store = useStore();
const isDarkMode = computed(() => store.getters.isDarkMode);

// Local state for theme settings
const themeSettings = ref({
  ...props.modelValue
});

// Available themes
const availableThemes = [
  { id: 'default', name: 'Default' },
  { id: 'dark', name: 'Dark' },
  { id: 'light', name: 'Light' },
  { id: 'purple', name: 'Purple' },
  { id: 'blue', name: 'Blue' },
  { id: 'green', name: 'Green' },
  { id: 'custom', name: 'Custom' }
];

// Available font sizes
const fontSizes = [
  { id: 'small', name: 'Small' },
  { id: 'medium', name: 'Medium' },
  { id: 'large', name: 'Large' }
];

// Available layouts
const layouts = [
  { id: 'standard', name: 'Standard' },
  { id: 'compact', name: 'Compact' },
  { id: 'wide', name: 'Wide' }
];

// Watch for changes in the modelValue prop
watch(() => props.modelValue, (newValue) => {
  themeSettings.value = { ...newValue };
}, { deep: true });

// Watch for changes in local state and emit updates
watch(themeSettings, (newValue) => {
  emit('update:modelValue', newValue);
}, { deep: true });

// Computed styles for preview
const previewStyles = computed(() => {
  const styles = {};
  
  if (themeSettings.value.theme === 'custom' && themeSettings.value.accent_color) {
    styles['--preview-accent-color'] = themeSettings.value.accent_color;
  } else {
    // Set accent color based on theme
    switch (themeSettings.value.theme) {
      case 'purple':
        styles['--preview-accent-color'] = '#9333ea';
        break;
      case 'blue':
        styles['--preview-accent-color'] = '#3b82f6';
        break;
      case 'green':
        styles['--preview-accent-color'] = '#10b981';
        break;
      case 'dark':
        styles['--preview-accent-color'] = '#6366f1';
        break;
      case 'light':
        styles['--preview-accent-color'] = '#8b5cf6';
        break;
      default:
        styles['--preview-accent-color'] = '#646cff';
    }
  }
  
  // Set font size
  switch (themeSettings.value.font_size) {
    case 'small':
      styles['--preview-font-size'] = '0.875rem';
      break;
    case 'large':
      styles['--preview-font-size'] = '1.125rem';
      break;
    default:
      styles['--preview-font-size'] = '1rem';
  }
  
  return styles;
});

// Reset to defaults
const resetToDefaults = () => {
  themeSettings.value = {
    theme: 'default',
    accent_color: '#646cff',
    font_size: 'medium',
    layout: 'standard'
  };
};
</script>

<template>
  <div class="theme-customizer" :class="{ 'dark-mode': isDarkMode }">
    <h3>Theme Customization</h3>
    
    <div class="customizer-section">
      <label for="theme-select">Theme</label>
      <select 
        id="theme-select" 
        v-model="themeSettings.theme"
        class="form-select"
      >
        <option v-for="theme in availableThemes" :key="theme.id" :value="theme.id">
          {{ theme.name }}
        </option>
      </select>
    </div>
    
    <div class="customizer-section" v-if="themeSettings.theme === 'custom'">
      <label for="accent-color">Accent Color</label>
      <div class="color-picker-wrapper">
        <input 
          type="color" 
          id="accent-color" 
          v-model="themeSettings.accent_color"
          class="color-picker"
        >
        <input 
          type="text" 
          v-model="themeSettings.accent_color"
          class="color-text"
          placeholder="#646cff"
        >
      </div>
    </div>
    
    <div class="customizer-section">
      <label for="font-size">Font Size</label>
      <select 
        id="font-size" 
        v-model="themeSettings.font_size"
        class="form-select"
      >
        <option v-for="size in fontSizes" :key="size.id" :value="size.id">
          {{ size.name }}
        </option>
      </select>
    </div>
    
    <div class="customizer-section">
      <label for="layout">Layout</label>
      <select 
        id="layout" 
        v-model="themeSettings.layout"
        class="form-select"
      >
        <option v-for="layout in layouts" :key="layout.id" :value="layout.id">
          {{ layout.name }}
        </option>
      </select>
    </div>
    
    <button @click="resetToDefaults" class="reset-button">
      Reset to Defaults
    </button>
    
    <div v-if="showPreview" class="theme-preview" :style="previewStyles">
      <h4>Preview</h4>
      <div class="preview-content">
        <div class="preview-header">
          <div class="preview-avatar"></div>
          <div class="preview-text">
            <div class="preview-title">Profile Name</div>
            <div class="preview-subtitle">@username</div>
          </div>
        </div>
        <div class="preview-body">
          <div class="preview-button">Follow</div>
          <div class="preview-button secondary">Message</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-customizer {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--border-color);
}

.customizer-section {
  margin-bottom: var(--spacing-md);
}

label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
  color: var(--text-color);
}

.form-select {
  width: 100%;
  padding: 0.5rem;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  background-color: var(--bg-color);
  color: var(--text-color);
  font-size: var(--font-size-md);
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.color-picker {
  height: 40px;
  width: 60px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}

.color-text {
  flex: 1;
  padding: 0.5rem;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  background-color: var(--bg-color);
  color: var(--text-color);
  font-size: var(--font-size-md);
}

.reset-button {
  margin-top: var(--spacing-sm);
  background-color: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-color);
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: background-color 0.2s, border-color 0.2s;
}

.reset-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  border-color: var(--text-color-light);
}

.dark-mode .reset-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Theme Preview */
.theme-preview {
  margin-top: var(--spacing-lg);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.theme-preview h4 {
  margin: 0;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--border-color);
  color: var(--text-color);
  font-size: var(--font-size-sm);
}

.preview-content {
  padding: var(--spacing-md);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.preview-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: var(--preview-accent-color, var(--primary-color));
  opacity: 0.8;
}

.preview-text {
  flex: 1;
}

.preview-title {
  font-size: var(--preview-font-size, var(--font-size-md));
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 4px;
}

.preview-subtitle {
  font-size: calc(var(--preview-font-size, var(--font-size-md)) * 0.85);
  color: var(--text-color-light);
}

.preview-body {
  display: flex;
  gap: var(--spacing-sm);
}

.preview-button {
  padding: 0.5rem 1rem;
  background-color: var(--preview-accent-color, var(--primary-color));
  color: white;
  border-radius: var(--border-radius-sm);
  font-size: calc(var(--preview-font-size, var(--font-size-md)) * 0.9);
  font-weight: 500;
  cursor: pointer;
}

.preview-button.secondary {
  background-color: transparent;
  border: 1px solid var(--preview-accent-color, var(--primary-color));
  color: var(--preview-accent-color, var(--primary-color));
}

/* Dark mode adjustments */
.dark-mode .form-select,
.dark-mode .color-text {
  background-color: var(--dark-card-bg);
  border-color: var(--dark-border-color);
  color: var(--dark-text-color);
}

.dark-mode .theme-preview h4 {
  background-color: var(--dark-border-color);
  color: var(--dark-text-color);
}

.dark-mode .preview-title {
  color: var(--dark-text-color);
}

.dark-mode .preview-subtitle {
  color: rgba(255, 255, 255, 0.6);
}
</style>