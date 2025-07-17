<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const store = useStore();
const route = useRoute();
const router = useRouter();

const profile = ref(null);
const isLoading = ref(true);
const isEditing = ref(false);
const activeTab = ref('posts'); // posts, about, media, friends
const error = ref(null);
const isMobile = ref(window.innerWidth < 768);

// Form data for editing
const formData = ref({
  display_name: '',
  bio: '',
  location: '',
  website: '',
  theme: 'default',
  privacy_settings: {
    show_email: false,
    show_location: true,
    show_friends: true,
    allow_mentions: true,
    allow_messages: true
  },
  social_links: {}
});

// Available themes
const availableThemes = [
  { id: 'default', name: 'Default' },
  { id: 'dark', name: 'Dark' },
  { id: 'light', name: 'Light' },
  { id: 'purple', name: 'Purple' },
  { id: 'blue', name: 'Blue' },
  { id: 'green', name: 'Green' }
];

// File inputs
const avatarFile = ref(null);
const backgroundFile = ref(null);
const avatarPreview = ref('');
const backgroundPreview = ref('');

// Check window size for responsive design
const checkWindowSize = () => {
  isMobile.value = window.innerWidth < 768;
};

// Add event listener for window resize
onMounted(() => {
  window.addEventListener('resize', checkWindowSize);
});

// Remove event listener when component is unmounted
onUnmounted(() => {
  window.removeEventListener('resize', checkWindowSize);
});

// Computed property to check if the profile belongs to the current user
const isOwnProfile = computed(() => {
  return store.getters['auth/isAuthenticated'] && 
         profile.value && 
         store.getters['auth/currentUser'].id === profile.value.user_id;
});

// Load profile data
const loadProfile = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const response = await axios.get('/api/profile');
    profile.value = response.data;
    
    // Initialize form data with current profile values
    formData.value = {
      display_name: profile.value.display_name || '',
      bio: profile.value.bio || '',
      location: profile.value.location || '',
      website: profile.value.website || '',
      theme: profile.value.theme || 'default',
      social_links: profile.value.social_links || {}
    };
  } catch (err) {
    error.value = 'Failed to load profile. Please try again.';
    console.error('Error loading profile:', err);
  } finally {
    isLoading.value = false;
  }
};

// Handle avatar file selection
const handleAvatarChange = (event) => {
  avatarFile.value = event.target.files[0];
};

// Handle background file selection
const handleBackgroundChange = (event) => {
  backgroundFile.value = event.target.files[0];
};

// Save profile changes
const saveProfile = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    // Create form data object for file uploads
    const data = new FormData();
    
    // Add text fields
    data.append('display_name', formData.value.display_name);
    data.append('bio', formData.value.bio);
    data.append('location', formData.value.location);
    data.append('website', formData.value.website);
    data.append('theme', formData.value.theme);
    
    // Add social links as JSON
    data.append('social_links', JSON.stringify(formData.value.social_links));
    
    // Add files if selected
    if (avatarFile.value) {
      data.append('avatar', avatarFile.value);
    }
    
    if (backgroundFile.value) {
      data.append('background_image', backgroundFile.value);
    }
    
    // Send update request
    const response = await axios.put('/api/profile', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Update profile with response data
    profile.value = response.data;
    isEditing.value = false;
    
    // Reset file inputs
    avatarFile.value = null;
    backgroundFile.value = null;
  } catch (err) {
    error.value = 'Failed to update profile. Please try again.';
    console.error('Error updating profile:', err);
  } finally {
    isLoading.value = false;
  }
};

// Cancel editing
const cancelEdit = () => {
  // Reset form data to current profile values
  formData.value = {
    display_name: profile.value.display_name || '',
    bio: profile.value.bio || '',
    location: profile.value.location || '',
    website: profile.value.website || '',
    theme: profile.value.theme || 'default',
    social_links: profile.value.social_links || {}
  };
  
  // Reset file inputs
  avatarFile.value = null;
  backgroundFile.value = null;
  
  // Exit edit mode
  isEditing.value = false;
};

// Add social media link
const addSocialLink = () => {
  if (!formData.value.social_links) {
    formData.value.social_links = {};
  }
  formData.value.social_links[''] = '';
};

// Remove social media link
const removeSocialLink = (platform) => {
  if (formData.value.social_links && formData.value.social_links[platform] !== undefined) {
    const updatedLinks = { ...formData.value.social_links };
    delete updatedLinks[platform];
    formData.value.social_links = updatedLinks;
  }
};

// Update social link platform or URL
const updateSocialLink = (oldPlatform, newPlatform, url) => {
  if (oldPlatform !== newPlatform) {
    // Platform name changed, create new entry and remove old one
    const updatedLinks = { ...formData.value.social_links };
    delete updatedLinks[oldPlatform];
    updatedLinks[newPlatform] = url;
    formData.value.social_links = updatedLinks;
  } else {
    // Just update the URL
    formData.value.social_links[oldPlatform] = url;
  }
};

// Load profile on component mount
onMounted(() => {
  loadProfile();
});
</script>

<template>
  <div class="profile-container">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Loading profile...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadProfile">Try Again</button>
    </div>
    
    <!-- Profile view/edit -->
    <div v-else-if="profile" class="profile-content">
      <!-- Profile header with background image -->
      <div class="profile-header" :style="{ backgroundImage: profile.background_image ? `url(${profile.background_image})` : '' }">
        <div v-if="isEditing" class="edit-background">
          <input type="file" id="background-upload" @change="handleBackgroundChange" accept="image/*">
          <label for="background-upload">Change Background</label>
        </div>
      </div>
      
      <!-- Profile info section -->
      <div class="profile-info">
        <!-- Avatar -->
        <div class="avatar-container">
          <img 
            :src="profile.avatar || '/default-avatar.png'" 
            alt="Profile Avatar" 
            class="avatar"
          >
          <div v-if="isEditing" class="edit-avatar">
            <input type="file" id="avatar-upload" @change="handleAvatarChange" accept="image/*">
            <label for="avatar-upload">Change Avatar</label>
          </div>
        </div>
        
        <!-- Profile details -->
        <div class="profile-details">
          <!-- View mode -->
          <div v-if="!isEditing" class="view-mode">
            <h1>{{ profile.display_name || 'User' }}</h1>
            <p v-if="profile.bio" class="bio">{{ profile.bio }}</p>
            <p v-if="profile.location" class="location">
              <span class="icon">📍</span> {{ profile.location }}
            </p>
            <p v-if="profile.website" class="website">
              <span class="icon">🔗</span>
              <a :href="profile.website" target="_blank" rel="noopener noreferrer">{{ profile.website }}</a>
            </p>
            
            <!-- Social links -->
            <div v-if="profile.social_links && Object.keys(profile.social_links).length > 0" class="social-links">
              <h3>Connect with me:</h3>
              <ul>
                <li v-for="(url, platform) in profile.social_links" :key="platform">
                  <a :href="url" target="_blank" rel="noopener noreferrer">
                    {{ platform }}
                  </a>
                </li>
              </ul>
            </div>
            
            <!-- Edit button (only for own profile) -->
            <button v-if="isOwnProfile" @click="isEditing = true" class="edit-button">
              Edit Profile
            </button>
          </div>
          
          <!-- Edit mode -->
          <div v-else class="edit-mode">
            <form @submit.prevent="saveProfile">
              <div class="form-group">
                <label for="display-name">Display Name</label>
                <input 
                  id="display-name"
                  v-model="formData.display_name"
                  type="text"
                  placeholder="Your display name"
                >
              </div>
              
              <div class="form-group">
                <label for="bio">Bio</label>
                <textarea 
                  id="bio"
                  v-model="formData.bio"
                  placeholder="Tell us about yourself"
                  rows="4"
                ></textarea>
              </div>
              
              <div class="form-group">
                <label for="location">Location</label>
                <input 
                  id="location"
                  v-model="formData.location"
                  type="text"
                  placeholder="Your location"
                >
              </div>
              
              <div class="form-group">
                <label for="website">Website</label>
                <input 
                  id="website"
                  v-model="formData.website"
                  type="url"
                  placeholder="https://yourwebsite.com"
                >
              </div>
              
              <div class="form-group">
                <label for="theme">Theme</label>
                <select id="theme" v-model="formData.theme">
                  <option value="default">Default</option>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                </select>
              </div>
              
              <!-- Social links editor -->
              <div class="form-group social-links-editor">
                <label>Social Media Links</label>
                <div 
                  v-for="(url, platform) in formData.social_links" 
                  :key="platform"
                  class="social-link-item"
                >
                  <input 
                    type="text" 
                    :value="platform"
                    placeholder="Platform (e.g. Twitter)"
                    @input="updateSocialLink(platform, $event.target.value, url)"
                  >
                  <input 
                    type="url" 
                    :value="url"
                    placeholder="URL"
                    @input="updateSocialLink(platform, platform, $event.target.value)"
                  >
                  <button type="button" @click="removeSocialLink(platform)" class="remove-link">
                    Remove
                  </button>
                </div>
                
                <button type="button" @click="addSocialLink" class="add-link">
                  Add Social Link
                </button>
              </div>
              
              <div class="form-actions">
                <button type="submit" class="save-button">Save Changes</button>
                <button type="button" @click="cancelEdit" class="cancel-button">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    
    <!-- No profile state -->
    <div v-else class="no-profile">
      <p>No profile found.</p>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.loading, .error, .no-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.profile-header {
  height: 200px;
  background-color: #e0e0e0;
  background-size: cover;
  background-position: center;
  border-radius: 8px 8px 0 0;
  position: relative;
}

.edit-background {
  position: absolute;
  bottom: 10px;
  right: 10px;
}

.edit-background input[type="file"] {
  display: none;
}

.edit-background label {
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.profile-info {
  padding: 20px;
  position: relative;
}

.avatar-container {
  position: absolute;
  top: -60px;
  left: 30px;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid white;
  object-fit: cover;
  background-color: #f0f0f0;
}

.edit-avatar {
  position: absolute;
  bottom: 0;
  right: 0;
}

.edit-avatar input[type="file"] {
  display: none;
}

.edit-avatar label {
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 6px 10px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
}

.profile-details {
  margin-top: 70px;
}

.view-mode h1 {
  font-size: 24px;
  margin-bottom: 10px;
}

.bio {
  margin-bottom: 15px;
  line-height: 1.5;
}

.location, .website {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: #666;
}

.icon {
  margin-right: 8px;
}

.social-links {
  margin-top: 20px;
}

.social-links h3 {
  font-size: 16px;
  margin-bottom: 10px;
}

.social-links ul {
  list-style: none;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.social-links a {
  display: inline-block;
  padding: 6px 12px;
  background-color: #f0f0f0;
  border-radius: 20px;
  text-decoration: none;
  color: #333;
  font-size: 14px;
}

.edit-button {
  margin-top: 20px;
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.edit-mode .form-group {
  margin-bottom: 15px;
}

.edit-mode label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.edit-mode input[type="text"],
.edit-mode input[type="url"],
.edit-mode textarea,
.edit-mode select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.social-links-editor .social-link-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.remove-link {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
}

.add-link {
  background-color: #2ecc71;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 10px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.save-button {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-button {
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
}
</style>