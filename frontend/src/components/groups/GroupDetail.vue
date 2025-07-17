<script setup>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const store = useStore();
const route = useRoute();
const router = useRouter();

// State variables
const group = ref(null);
const isLoading = ref(true);
const error = ref(null);
const isEditing = ref(false);
const showMembersList = ref(false);
const memberRole = ref('member');

// Form data for editing
const formData = ref({
  name: '',
  description: '',
  privacy_type: 'public',
});

// File inputs
const avatarFile = ref(null);
const coverFile = ref(null);

// Computed properties
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
const currentUser = computed(() => store.getters['auth/currentUser']);

// Check if current user is a member of the group
const isMember = computed(() => {
  if (!isAuthenticated.value || !group.value || !group.value.members) return false;
  
  return group.value.members.some(member => member.id === currentUser.value.id);
});

// Get current user's role in the group
const userRole = computed(() => {
  if (!isMember.value) return null;
  
  const member = group.value.members.find(member => member.id === currentUser.value.id);
  return member ? member.pivot.role : null;
});

// Check if current user is admin or owner
const isAdminOrOwner = computed(() => {
  if (!isAuthenticated.value || !group.value) return false;
  
  return group.value.owner_id === currentUser.value.id || userRole.value === 'admin';
});

// Check if current user is moderator
const isModerator = computed(() => {
  if (!isAuthenticated.value || !group.value) return false;
  
  return userRole.value === 'moderator';
});

// Check if current user can manage members
const canManageMembers = computed(() => {
  return isAdminOrOwner.value || isModerator.value;
});

// Load group data
const loadGroup = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const slug = route.params.slug;
    const response = await axios.get(`/api/groups/${slug}`);
    group.value = response.data;
    
    // Initialize form data with current group values
    formData.value = {
      name: group.value.name,
      description: group.value.description || '',
      privacy_type: group.value.privacy_type,
    };
  } catch (err) {
    error.value = 'Failed to load group. Please try again.';
    console.error('Error loading group:', err);
  } finally {
    isLoading.value = false;
  }
};

// Handle avatar file selection
const handleAvatarChange = (event) => {
  avatarFile.value = event.target.files[0];
};

// Handle cover file selection
const handleCoverChange = (event) => {
  coverFile.value = event.target.files[0];
};

// Save group changes
const saveGroup = async () => {
  if (!isAdminOrOwner.value) return;
  
  isLoading.value = true;
  error.value = null;
  
  try {
    // Create form data object for file uploads
    const data = new FormData();
    
    // Add text fields
    data.append('name', formData.value.name);
    data.append('description', formData.value.description);
    data.append('privacy_type', formData.value.privacy_type);
    
    // Add files if selected
    if (avatarFile.value) {
      data.append('avatar', avatarFile.value);
    }
    
    if (coverFile.value) {
      data.append('cover_image', coverFile.value);
    }
    
    // Send update request
    const response = await axios.put(`/api/groups/${group.value.id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Update group with response data
    group.value = response.data;
    isEditing.value = false;
    
    // Reset file inputs
    avatarFile.value = null;
    coverFile.value = null;
  } catch (err) {
    error.value = 'Failed to update group. Please try again.';
    console.error('Error updating group:', err);
  } finally {
    isLoading.value = false;
  }
};

// Cancel editing
const cancelEdit = () => {
  // Reset form data to current group values
  formData.value = {
    name: group.value.name,
    description: group.value.description || '',
    privacy_type: group.value.privacy_type,
  };
  
  // Reset file inputs
  avatarFile.value = null;
  coverFile.value = null;
  
  // Exit edit mode
  isEditing.value = false;
};

// Join group
const joinGroup = async () => {
  if (!isAuthenticated.value) {
    router.push('/login');
    return;
  }
  
  try {
    await axios.post(`/api/groups/${group.value.id}/members`, {
      user_id: currentUser.value.id,
      role: 'member'
    });
    
    // Reload group data to update members list
    await loadGroup();
  } catch (err) {
    error.value = 'Failed to join group. Please try again.';
    console.error('Error joining group:', err);
  }
};

// Leave group
const leaveGroup = async () => {
  if (!isAuthenticated.value || !isMember.value) return;
  
  try {
    await axios.delete(`/api/groups/${group.value.id}/members/${currentUser.value.id}`);
    
    // Reload group data to update members list
    await loadGroup();
  } catch (err) {
    error.value = 'Failed to leave group. Please try again.';
    console.error('Error leaving group:', err);
  }
};

// Delete group
const deleteGroup = async () => {
  if (!isAdminOrOwner.value) return;
  
  if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
    return;
  }
  
  try {
    await axios.delete(`/api/groups/${group.value.id}`);
    
    // Redirect to groups list
    router.push('/groups');
  } catch (err) {
    error.value = 'Failed to delete group. Please try again.';
    console.error('Error deleting group:', err);
  }
};

// Update member role
const updateMemberRole = async (userId, newRole) => {
  if (!canManageMembers.value) return;
  
  try {
    await axios.put(`/api/groups/${group.value.id}/members/${userId}`, {
      role: newRole
    });
    
    // Reload group data to update members list
    await loadGroup();
  } catch (err) {
    error.value = 'Failed to update member role. Please try again.';
    console.error('Error updating member role:', err);
  }
};

// Remove member from group
const removeMember = async (userId) => {
  if (!canManageMembers.value) return;
  
  if (!confirm('Are you sure you want to remove this member from the group?')) {
    return;
  }
  
  try {
    await axios.delete(`/api/groups/${group.value.id}/members/${userId}`);
    
    // Reload group data to update members list
    await loadGroup();
  } catch (err) {
    error.value = 'Failed to remove member. Please try again.';
    console.error('Error removing member:', err);
  }
};

// Add new member to group
const addMember = async () => {
  if (!canManageMembers.value) return;
  
  // This would typically involve a search for users and selection
  // For simplicity, we'll assume we have a userId to add
  const userId = prompt('Enter user ID to add:');
  if (!userId) return;
  
  try {
    await axios.post(`/api/groups/${group.value.id}/members`, {
      user_id: userId,
      role: memberRole.value
    });
    
    // Reload group data to update members list
    await loadGroup();
  } catch (err) {
    error.value = 'Failed to add member. Please try again.';
    console.error('Error adding member:', err);
  }
};

// Load data on component mount
onMounted(() => {
  loadGroup();
});
</script>

<template>
  <div class="group-container">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Loading group...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadGroup">Try Again</button>
    </div>
    
    <!-- Group view/edit -->
    <div v-else-if="group" class="group-content">
      <!-- Group header with cover image -->
      <div class="group-header" :style="{ backgroundImage: group.cover_image ? `url(${group.cover_image})` : '' }">
        <div v-if="isEditing" class="edit-cover">
          <input type="file" id="cover-upload" @change="handleCoverChange" accept="image/*">
          <label for="cover-upload">Change Cover</label>
        </div>
      </div>
      
      <!-- Group info section -->
      <div class="group-info">
        <!-- Avatar -->
        <div class="avatar-container">
          <img 
            :src="group.avatar || '/default-group.png'" 
            alt="Group Avatar" 
            class="avatar"
          >
          <div v-if="isEditing" class="edit-avatar">
            <input type="file" id="avatar-upload" @change="handleAvatarChange" accept="image/*">
            <label for="avatar-upload">Change Avatar</label>
          </div>
        </div>
        
        <!-- Group details -->
        <div class="group-details">
          <!-- View mode -->
          <div v-if="!isEditing" class="view-mode">
            <div class="group-header-info">
              <h1>{{ group.name }}</h1>
              <span class="privacy-badge" :class="group.privacy_type">
                {{ group.privacy_type }}
              </span>
            </div>
            
            <p v-if="group.description" class="description">{{ group.description }}</p>
            
            <div class="group-meta">
              <p class="owner">
                <span class="label">Owner:</span> {{ group.owner ? group.owner.name : 'Unknown' }}
              </p>
              <p class="members-count">
                <span class="label">Members:</span> {{ group.members ? group.members.length : 0 }}
              </p>
              <p class="created-at">
                <span class="label">Created:</span> {{ new Date(group.created_at).toLocaleDateString() }}
              </p>
            </div>
            
            <!-- Action buttons -->
            <div class="action-buttons">
              <button 
                v-if="isAdminOrOwner" 
                @click="isEditing = true" 
                class="edit-button"
              >
                Edit Group
              </button>
              
              <button 
                v-if="isAdminOrOwner" 
                @click="deleteGroup" 
                class="delete-button"
              >
                Delete Group
              </button>
              
              <button 
                v-if="!isMember" 
                @click="joinGroup" 
                class="join-button"
              >
                Join Group
              </button>
              
              <button 
                v-if="isMember && !isAdminOrOwner" 
                @click="leaveGroup" 
                class="leave-button"
              >
                Leave Group
              </button>
              
              <button 
                @click="showMembersList = !showMembersList" 
                class="members-button"
              >
                {{ showMembersList ? 'Hide Members' : 'Show Members' }}
              </button>
            </div>
          </div>
          
          <!-- Edit mode -->
          <div v-else class="edit-mode">
            <form @submit.prevent="saveGroup">
              <div class="form-group">
                <label for="group-name">Group Name</label>
                <input 
                  id="group-name"
                  v-model="formData.name"
                  type="text"
                  placeholder="Group name"
                  required
                >
              </div>
              
              <div class="form-group">
                <label for="group-description">Description</label>
                <textarea 
                  id="group-description"
                  v-model="formData.description"
                  placeholder="Group description"
                  rows="4"
                ></textarea>
              </div>
              
              <div class="form-group">
                <label for="privacy-type">Privacy Setting</label>
                <select id="privacy-type" v-model="formData.privacy_type" required>
                  <option value="public">Public - Anyone can see and join</option>
                  <option value="closed">Closed - Anyone can see, but must request to join</option>
                  <option value="private">Private - Only members can see content</option>
                </select>
              </div>
              
              <div class="form-actions">
                <button type="submit" class="save-button">Save Changes</button>
                <button type="button" @click="cancelEdit" class="cancel-button">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <!-- Members list -->
      <div v-if="showMembersList" class="members-list">
        <div class="members-header">
          <h2>Group Members</h2>
          <div v-if="canManageMembers" class="add-member">
            <select v-model="memberRole">
              <option value="member">Member</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
            <button @click="addMember" class="add-button">Add Member</button>
          </div>
        </div>
        
        <div class="members-grid">
          <div 
            v-for="member in group.members" 
            :key="member.id"
            class="member-card"
          >
            <div class="member-info">
              <h3>{{ member.name }}</h3>
              <p class="member-email">{{ member.email }}</p>
              <span class="role-badge" :class="member.pivot.role">
                {{ member.pivot.role }}
              </span>
            </div>
            
            <div v-if="canManageMembers && member.id !== group.owner_id && member.id !== currentUser.id" class="member-actions">
              <select 
                v-model="member.pivot.role"
                @change="updateMemberRole(member.id, member.pivot.role)"
              >
                <option value="member">Member</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
              
              <button @click="removeMember(member.id)" class="remove-button">
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- No group state -->
    <div v-else class="no-group">
      <p>Group not found.</p>
      <button @click="router.push('/groups')">Back to Groups</button>
    </div>
  </div>
</template>

<style scoped>
.group-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.loading, .error, .no-group {
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

.group-header {
  height: 200px;
  background-color: #e0e0e0;
  background-size: cover;
  background-position: center;
  border-radius: 8px 8px 0 0;
  position: relative;
}

.edit-cover {
  position: absolute;
  bottom: 10px;
  right: 10px;
}

.edit-cover input[type="file"] {
  display: none;
}

.edit-cover label {
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.group-info {
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

.group-details {
  margin-top: 70px;
}

.group-header-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.view-mode h1 {
  font-size: 24px;
  margin: 0;
}

.privacy-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
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

.description {
  margin-bottom: 20px;
  line-height: 1.5;
}

.group-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
  color: #666;
  font-size: 14px;
}

.label {
  font-weight: bold;
  margin-right: 5px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.edit-button, .members-button {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
}

.delete-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
}

.join-button {
  background-color: #2ecc71;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
}

.leave-button {
  background-color: #f39c12;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
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
.edit-mode textarea,
.edit-mode select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
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

.members-list {
  margin-top: 30px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.members-header h2 {
  margin: 0;
  font-size: 20px;
}

.add-member {
  display: flex;
  gap: 10px;
}

.add-member select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.add-button {
  background-color: #2ecc71;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.member-card {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.member-info h3 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.member-email {
  color: #666;
  font-size: 14px;
  margin: 0 0 10px 0;
}

.role-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  text-transform: capitalize;
}

.role-badge.admin {
  background-color: #e74c3c;
  color: white;
}

.role-badge.moderator {
  background-color: #f39c12;
  color: white;
}

.role-badge.member {
  background-color: #3498db;
  color: white;
}

.member-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-actions select {
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.remove-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .group-meta {
    flex-direction: column;
    gap: 10px;
  }
  
  .members-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .members-grid {
    grid-template-columns: 1fr;
  }
}
</style>