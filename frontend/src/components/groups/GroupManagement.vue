<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

const props = defineProps({
  groupId: {
    type: [Number, String],
    default: null
  }
});

const store = useStore();
const router = useRouter();

// State variables
const isLoading = ref(false);
const error = ref(null);
const success = ref(null);
const showMembersList = ref(false);
const showInviteForm = ref(false);
const inviteEmail = ref('');
const selectedRole = ref('member');
const searchMember = ref('');

// Computed properties
const currentUser = computed(() => store.getters['auth/currentUser']);
const group = computed(() => store.getters['groups/currentGroup']);
const isDarkMode = computed(() => store.getters.isDarkMode);

// Check if current user is admin or owner
const isAdminOrOwner = computed(() => {
  if (!group.value || !currentUser.value) return false;
  
  return group.value.owner_id === currentUser.value.id || 
         (group.value.members && group.value.members.some(m => 
           m.id === currentUser.value.id && m.pivot.role === 'admin'
         ));
});

// Check if current user is moderator
const isModerator = computed(() => {
  if (!group.value || !currentUser.value) return false;
  
  return group.value.members && group.value.members.some(m => 
    m.id === currentUser.value.id && m.pivot.role === 'moderator'
  );
});

// Check if current user can manage members
const canManageMembers = computed(() => {
  return isAdminOrOwner.value || isModerator.value;
});

// Filtered members list
const filteredMembers = computed(() => {
  if (!group.value || !group.value.members) return [];
  
  if (!searchMember.value) return group.value.members;
  
  const search = searchMember.value.toLowerCase();
  return group.value.members.filter(member => 
    member.name.toLowerCase().includes(search) || 
    member.email.toLowerCase().includes(search)
  );
});

// Load group data
const loadGroup = async () => {
  if (!props.groupId) return;
  
  isLoading.value = true;
  error.value = null;
  
  try {
    await store.dispatch('groups/fetchGroup', props.groupId);
  } catch (err) {
    error.value = 'Failed to load group. Please try again.';
    console.error('Error loading group:', err);
  } finally {
    isLoading.value = false;
  }
};

// Invite a user to the group
const inviteUser = async () => {
  if (!inviteEmail.value.trim()) return;
  
  isLoading.value = true;
  error.value = null;
  success.value = null;
  
  try {
    await store.dispatch('groups/inviteUser', {
      groupId: props.groupId,
      email: inviteEmail.value,
      role: selectedRole.value
    });
    
    success.value = `Invitation sent to ${inviteEmail.value}`;
    inviteEmail.value = '';
    showInviteForm.value = false;
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to send invitation';
    console.error('Error inviting user:', err);
  } finally {
    isLoading.value = false;
  }
};

// Update member role
const updateMemberRole = async (memberId, role) => {
  isLoading.value = true;
  error.value = null;
  
  try {
    await store.dispatch('groups/updateMemberRole', {
      groupId: props.groupId,
      memberId,
      role
    });
    
    success.value = 'Member role updated successfully';
    setTimeout(() => {
      success.value = null;
    }, 3000);
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update member role';
    console.error('Error updating member role:', err);
  } finally {
    isLoading.value = false;
  }
};

// Remove member from group
const removeMember = async (memberId) => {
  if (!confirm('Are you sure you want to remove this member?')) return;
  
  isLoading.value = true;
  error.value = null;
  
  try {
    await store.dispatch('groups/removeMember', {
      groupId: props.groupId,
      memberId
    });
    
    success.value = 'Member removed successfully';
    setTimeout(() => {
      success.value = null;
    }, 3000);
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to remove member';
    console.error('Error removing member:', err);
  } finally {
    isLoading.value = false;
  }
};

// Leave group
const leaveGroup = async () => {
  if (!confirm('Are you sure you want to leave this group?')) return;
  
  isLoading.value = true;
  error.value = null;
  
  try {
    await store.dispatch('groups/leaveGroup', props.groupId);
    router.push('/groups');
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to leave group';
    console.error('Error leaving group:', err);
  } finally {
    isLoading.value = false;
  }
};

// Delete group
const deleteGroup = async () => {
  if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
  
  isLoading.value = true;
  error.value = null;
  
  try {
    await store.dispatch('groups/deleteGroup', props.groupId);
    router.push('/groups');
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to delete group';
    console.error('Error deleting group:', err);
  } finally {
    isLoading.value = false;
  }
};

// Load group data on mount
onMounted(() => {
  loadGroup();
});
</script>

<template>
  <div class="group-management" :class="{ 'dark-mode': isDarkMode }">
    <div v-if="isLoading" class="loading-indicator">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
      <button @click="loadGroup" class="retry-button">Retry</button>
    </div>
    
    <div v-else-if="group" class="management-content">
      <div v-if="success" class="success-message">
        {{ success }}
      </div>
      
      <!-- Group Info Section -->
      <div class="info-section">
        <h2>{{ group.name }}</h2>
        <div class="group-meta">
          <span class="privacy-badge" :class="group.privacy_type">
            {{ group.privacy_type.charAt(0).toUpperCase() + group.privacy_type.slice(1) }}
          </span>
          <span class="member-count">{{ group.members?.length || 0 }} members</span>
        </div>
        <p v-if="group.description" class="description">{{ group.description }}</p>
      </div>
      
      <!-- Management Actions -->
      <div class="management-actions">
        <button 
          v-if="canManageMembers" 
          @click="showMembersList = !showMembersList"
          class="action-button"
        >
          <span v-if="!showMembersList">Manage Members</span>
          <span v-else>Hide Members List</span>
        </button>
        
        <button 
          v-if="isAdminOrOwner" 
          @click="showInviteForm = !showInviteForm"
          class="action-button"
        >
          <span v-if="!showInviteForm">Invite Members</span>
          <span v-else>Cancel Invitation</span>
        </button>
        
        <button 
          v-if="!isAdminOrOwner" 
          @click="leaveGroup"
          class="action-button danger"
        >
          Leave Group
        </button>
        
        <button 
          v-if="isAdminOrOwner && group.owner_id === currentUser?.id" 
          @click="deleteGroup"
          class="action-button danger"
        >
          Delete Group
        </button>
      </div>
      
      <!-- Invite Form -->
      <div v-if="showInviteForm" class="invite-form">
        <h3>Invite New Members</h3>
        <div class="form-group">
          <label for="invite-email">Email Address</label>
          <input 
            type="email" 
            id="invite-email" 
            v-model="inviteEmail"
            placeholder="Enter email address"
            class="form-input"
          >
        </div>
        
        <div class="form-group">
          <label for="role-select">Role</label>
          <select id="role-select" v-model="selectedRole" class="form-select">
            <option value="member">Member</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        <div class="form-actions">
          <button 
            @click="inviteUser"
            class="submit-button"
            :disabled="isLoading || !inviteEmail.trim()"
          >
            <span v-if="isLoading">Sending...</span>
            <span v-else>Send Invitation</span>
          </button>
        </div>
      </div>
      
      <!-- Members List -->
      <div v-if="showMembersList" class="members-list">
        <h3>Group Members</h3>
        
        <div class="search-bar">
          <input 
            type="text" 
            v-model="searchMember"
            placeholder="Search members..."
            class="search-input"
          >
        </div>
        
        <div v-if="filteredMembers.length === 0" class="no-results">
          No members found matching your search.
        </div>
        
        <ul v-else class="members">
          <li v-for="member in filteredMembers" :key="member.id" class="member-item">
            <div class="member-info">
              <div class="member-avatar" :style="{ backgroundColor: `hsl(${member.id * 30 % 360}, 70%, 60%)` }">
                {{ member.name.charAt(0).toUpperCase() }}
              </div>
              <div class="member-details">
                <div class="member-name">{{ member.name }}</div>
                <div class="member-role">
                  {{ member.pivot.role.charAt(0).toUpperCase() + member.pivot.role.slice(1) }}
                  <span v-if="member.id === group.owner_id" class="owner-badge">Owner</span>
                </div>
              </div>
            </div>
            
            <div v-if="canManageMembers && member.id !== currentUser?.id && member.id !== group.owner_id" class="member-actions">
              <select 
                v-if="isAdminOrOwner" 
                v-model="member.pivot.role"
                @change="updateMemberRole(member.id, member.pivot.role)"
                class="role-select"
              >
                <option value="member">Member</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
              
              <button 
                v-if="isAdminOrOwner || (isModerator && member.pivot.role === 'member')" 
                @click="removeMember(member.id)"
                class="remove-button"
                title="Remove member"
              >
                ×
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <p>No group selected or group not found.</p>
      <button @click="$router.push('/groups')" class="action-button">Browse Groups</button>
    </div>
  </div>
</template>

<style scoped>
.group-management {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--border-color);
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: var(--error-color);
  padding: var(--spacing-md);
  background-color: rgba(239, 68, 68, 0.1);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.success-message {
  color: var(--success-color);
  padding: var(--spacing-md);
  background-color: rgba(16, 185, 129, 0.1);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
}

.retry-button {
  background-color: transparent;
  border: 1px solid var(--error-color);
  color: var(--error-color);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.info-section {
  margin-bottom: var(--spacing-lg);
}

.group-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.privacy-badge {
  font-size: var(--font-size-xs);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-full);
  font-weight: 500;
}

.privacy-badge.public {
  background-color: rgba(16, 185, 129, 0.2);
  color: var(--success-color);
}

.privacy-badge.private {
  background-color: rgba(239, 68, 68, 0.2);
  color: var(--error-color);
}

.privacy-badge.restricted {
  background-color: rgba(245, 158, 11, 0.2);
  color: var(--warning-color);
}

.member-count {
  font-size: var(--font-size-sm);
  color: var(--text-color-light);
}

.description {
  margin-top: var(--spacing-sm);
  color: var(--text-color);
  line-height: 1.5;
}

.management-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
}

.action-button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-button:hover {
  background-color: var(--primary-hover);
}

.action-button.danger {
  background-color: var(--error-color);
}

.action-button.danger:hover {
  background-color: #dc2626;
}

.invite-form, .members-list {
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.dark-mode .invite-form, .dark-mode .members-list {
  background-color: rgba(255, 255, 255, 0.05);
}

.form-group {
  margin-bottom: var(--spacing-md);
}

label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
  color: var(--text-color);
}

.form-input, .form-select, .search-input {
  width: 100%;
  padding: 0.5rem;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  background-color: var(--bg-color);
  color: var(--text-color);
  font-size: var(--font-size-md);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.submit-button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover {
  background-color: var(--primary-hover);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-bar {
  margin-bottom: var(--spacing-md);
}

.no-results {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--text-color-light);
}

.members {
  list-style: none;
  padding: 0;
  margin: 0;
}

.member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
}

.member-item:last-child {
  border-bottom: none;
}

.member-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: var(--font-size-md);
}

.member-details {
  display: flex;
  flex-direction: column;
}

.member-name {
  font-weight: 500;
  color: var(--text-color);
}

.member-role {
  font-size: var(--font-size-xs);
  color: var(--text-color-light);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.owner-badge {
  background-color: var(--primary-color);
  color: white;
  padding: 0.1rem 0.3rem;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
}

.member-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.role-select {
  padding: 0.25rem;
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--border-color);
  background-color: var(--bg-color);
  color: var(--text-color);
  font-size: var(--font-size-xs);
}

.remove-button {
  background-color: transparent;
  border: none;
  color: var(--error-color);
  font-size: var(--font-size-xl);
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.remove-button:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-color-light);
}

/* Dark mode adjustments */
.dark-mode .form-input,
.dark-mode .form-select,
.dark-mode .search-input,
.dark-mode .role-select {
  background-color: var(--dark-card-bg);
  border-color: var(--dark-border-color);
  color: var(--dark-text-color);
}

.dark-mode .spinner {
  border-color: rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary-color);
}

.dark-mode .member-name {
  color: var(--dark-text-color);
}

.dark-mode .description {
  color: var(--dark-text-color);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .management-actions {
    flex-direction: column;
  }
  
  .action-button {
    width: 100%;
  }
  
  .member-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
  
  .member-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: var(--spacing-xs);
  }
}
</style>