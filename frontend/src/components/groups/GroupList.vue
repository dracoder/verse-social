<script setup>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import axios from 'axios';

const store = useStore();
const router = useRouter();

// State variables
const groups = ref([]);
const myGroups = ref([]);
const isLoading = ref(true);
const error = ref(null);
const searchQuery = ref('');
const privacyFilter = ref('all');
const showCreateForm = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);

// Create group form data
const newGroup = ref({
  name: '',
  description: '',
  privacy_type: 'public',
  avatar: null,
  cover_image: null
});

// Computed property to check if user is authenticated
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);

// Computed property for filtered groups
const filteredGroups = computed(() => {
  let filtered = [...groups.value];
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(group => 
      group.name.toLowerCase().includes(query) || 
      (group.description && group.description.toLowerCase().includes(query))
    );
  }
  
  // Apply privacy filter
  if (privacyFilter.value !== 'all') {
    filtered = filtered.filter(group => group.privacy_type === privacyFilter.value);
  }
  
  return filtered;
});

// Load all public groups
const loadGroups = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const response = await axios.get('/api/groups', {
      params: {
        page: currentPage.value,
        privacy_type: 'public' // Only load public groups for non-authenticated users
      }
    });
    
    groups.value = response.data.data;
    totalPages.value = Math.ceil(response.data.total / response.data.per_page);
  } catch (err) {
    error.value = 'Failed to load groups. Please try again.';
    console.error('Error loading groups:', err);
  } finally {
    isLoading.value = false;
  }
};

// Load groups that the current user is a member of
const loadMyGroups = async () => {
  if (!isAuthenticated.value) return;
  
  try {
    const response = await axios.get('/api/groups/my');
    myGroups.value = response.data;
  } catch (err) {
    console.error('Error loading my groups:', err);
  }
};

// Handle avatar file selection
const handleAvatarChange = (event) => {
  newGroup.value.avatar = event.target.files[0];
};

// Handle cover image file selection
const handleCoverChange = (event) => {
  newGroup.value.cover_image = event.target.files[0];
};

// Create a new group
const createGroup = async () => {
  if (!isAuthenticated.value) {
    // Redirect to login if not authenticated
    router.push('/login');
    return;
  }
  
  isLoading.value = true;
  error.value = null;
  
  try {
    // Create form data object for file uploads
    const data = new FormData();
    
    // Add text fields
    data.append('name', newGroup.value.name);
    data.append('description', newGroup.value.description);
    data.append('privacy_type', newGroup.value.privacy_type);
    
    // Add files if selected
    if (newGroup.value.avatar) {
      data.append('avatar', newGroup.value.avatar);
    }
    
    if (newGroup.value.cover_image) {
      data.append('cover_image', newGroup.value.cover_image);
    }
    
    // Send create request
    const response = await axios.post('/api/groups', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Add new group to list and reset form
    groups.value.unshift(response.data);
    myGroups.value.unshift(response.data);
    resetCreateForm();
    
    // Navigate to the new group page
    router.push(`/groups/${response.data.slug}`);
  } catch (err) {
    error.value = 'Failed to create group. Please try again.';
    console.error('Error creating group:', err);
  } finally {
    isLoading.value = false;
  }
};

// Reset the create group form
const resetCreateForm = () => {
  newGroup.value = {
    name: '',
    description: '',
    privacy_type: 'public',
    avatar: null,
    cover_image: null
  };
  showCreateForm.value = false;
};

// Navigate to group details page
const viewGroup = (slug) => {
  router.push(`/groups/${slug}`);
};

// Change page
const changePage = (page) => {
  currentPage.value = page;
  loadGroups();
};

// Load data on component mount
onMounted(() => {
  loadGroups();
  if (isAuthenticated.value) {
    loadMyGroups();
  }
});
</script>

<template>
  <div class="groups-container">
    <div class="groups-header">
      <h1>Groups</h1>
      <button 
        v-if="isAuthenticated" 
        @click="showCreateForm = !showCreateForm"
        class="create-group-button"
      >
        {{ showCreateForm ? 'Cancel' : 'Create Group' }}
      </button>
    </div>
    
    <!-- Create Group Form -->
    <div v-if="showCreateForm" class="create-group-form">
      <h2>Create New Group</h2>
      <form @submit.prevent="createGroup">
        <div class="form-group">
          <label for="group-name">Group Name *</label>
          <input 
            id="group-name"
            v-model="newGroup.name"
            type="text"
            placeholder="Enter group name"
            required
          >
        </div>
        
        <div class="form-group">
          <label for="group-description">Description</label>
          <textarea 
            id="group-description"
            v-model="newGroup.description"
            placeholder="Describe your group"
            rows="4"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="privacy-type">Privacy Setting *</label>
          <select id="privacy-type" v-model="newGroup.privacy_type" required>
            <option value="public">Public - Anyone can see and join</option>
            <option value="closed">Closed - Anyone can see, but must request to join</option>
            <option value="private">Private - Only members can see content</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="group-avatar">Group Avatar</label>
          <input 
            type="file" 
            id="group-avatar" 
            @change="handleAvatarChange"
            accept="image/*"
          >
        </div>
        
        <div class="form-group">
          <label for="group-cover">Cover Image</label>
          <input 
            type="file" 
            id="group-cover" 
            @change="handleCoverChange"
            accept="image/*"
          >
        </div>
        
        <div class="form-actions">
          <button type="submit" class="submit-button">Create Group</button>
          <button type="button" @click="resetCreateForm" class="cancel-button">Cancel</button>
        </div>
      </form>
    </div>
    
    <!-- My Groups Section -->
    <div v-if="isAuthenticated && myGroups.length > 0" class="my-groups-section">
      <h2>My Groups</h2>
      <div class="groups-grid">
        <div 
          v-for="group in myGroups" 
          :key="group.id"
          class="group-card"
          @click="viewGroup(group.slug)"
        >
          <div class="group-cover" :style="{ backgroundImage: group.cover_image ? `url(${group.cover_image})` : '' }">
            <div class="group-avatar">
              <img :src="group.avatar || '/default-group.png'" alt="Group Avatar">
            </div>
          </div>
          <div class="group-info">
            <h3>{{ group.name }}</h3>
            <p v-if="group.description" class="group-description">{{ group.description }}</p>
            <div class="group-meta">
              <span class="privacy-badge" :class="group.privacy_type">
                {{ group.privacy_type }}
              </span>
              <span class="role-badge" v-if="group.pivot">
                {{ group.pivot.role }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Search and Filter -->
    <div class="search-filter">
      <div class="search-box">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search groups..."
        >
      </div>
      
      <div class="filter-box">
        <label for="privacy-filter">Filter by:</label>
        <select id="privacy-filter" v-model="privacyFilter">
          <option value="all">All Groups</option>
          <option value="public">Public</option>
          <option value="closed">Closed</option>
          <option value="private">Private</option>
        </select>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Loading groups...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadGroups">Try Again</button>
    </div>
    
    <!-- Groups List -->
    <div v-else class="groups-list">
      <h2>Discover Groups</h2>
      
      <!-- No results message -->
      <div v-if="filteredGroups.length === 0" class="no-results">
        <p>No groups found matching your criteria.</p>
      </div>
      
      <!-- Groups grid -->
      <div v-else class="groups-grid">
        <div 
          v-for="group in filteredGroups" 
          :key="group.id"
          class="group-card"
          @click="viewGroup(group.slug)"
        >
          <div class="group-cover" :style="{ backgroundImage: group.cover_image ? `url(${group.cover_image})` : '' }">
            <div class="group-avatar">
              <img :src="group.avatar || '/default-group.png'" alt="Group Avatar">
            </div>
          </div>
          <div class="group-info">
            <h3>{{ group.name }}</h3>
            <p v-if="group.description" class="group-description">{{ group.description }}</p>
            <div class="group-meta">
              <span class="privacy-badge" :class="group.privacy_type">
                {{ group.privacy_type }}
              </span>
              <span class="members-count" v-if="group.members_count">
                {{ group.members_count }} members
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
          class="page-button"
        >
          Previous
        </button>
        
        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
        
        <button 
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
          class="page-button"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.groups-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.groups-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.create-group-button {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
}

.create-group-form {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.create-group-form h2 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input[type="text"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.submit-button {
  background-color: #2ecc71;
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

.my-groups-section {
  margin-bottom: 30px;
}

.search-filter {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.search-box {
  flex: 1;
}

.search-box input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.filter-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-box select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.loading, .error, .no-results {
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

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.group-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.group-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.group-cover {
  height: 120px;
  background-color: #e0e0e0;
  background-size: cover;
  background-position: center;
  position: relative;
}

.group-avatar {
  position: absolute;
  bottom: -30px;
  left: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid white;
  overflow: hidden;
  background-color: white;
}

.group-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.group-info {
  padding: 40px 20px 20px;
}

.group-info h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 18px;
}

.group-description {
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.privacy-badge {
  padding: 4px 8px;
  border-radius: 12px;
  text-transform: capitalize;
}

.privacy-badge.public {
  background-color: #2ecc71;
  color: white;
}

.privacy-badge.closed {
  background-color: #f39c12;
  color: white;
}

.privacy-badge.private {
  background-color: #e74c3c;
  color: white;
}

.role-badge {
  padding: 4px 8px;
  border-radius: 12px;
  background-color: #3498db;
  color: white;
  text-transform: capitalize;
}

.members-count {
  color: #666;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 30px;
}

.page-button {
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.page-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .groups-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
  
  .search-filter {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .groups-grid {
    grid-template-columns: 1fr;
  }
  
  .groups-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .create-group-button {
    width: 100%;
  }
}
</style>