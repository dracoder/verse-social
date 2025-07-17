<template>
  <div class="feed-filters">
    <h3 class="filters-title">Customize Your Feed</h3>
    
    <div class="filter-section">
      <h4>View</h4>
      <div class="view-options">
        <button 
          v-for="view in viewOptions" 
          :key="view.id"
          class="view-option"
          :class="{ 'active': modelValue.viewType === view.id }"
          @click="updateViewType(view.id)"
        >
          <span class="view-icon">{{ view.icon }}</span>
          <span class="view-label">{{ view.label }}</span>
        </button>
      </div>
    </div>
    
    <div class="filter-section">
      <h4>Content Type</h4>
      <div class="content-filters">
        <label v-for="type in contentTypes" :key="type.id" class="filter-checkbox">
          <input 
            type="checkbox" 
            :checked="isContentTypeSelected(type.id)"
            @change="toggleContentType(type.id)"
          />
          <span class="checkbox-label">{{ type.label }}</span>
        </label>
      </div>
    </div>
    
    <div class="filter-section">
      <h4>Sort By</h4>
      <select v-model="modelValue.sortBy" @change="updateModelValue" class="sort-select">
        <option v-for="option in sortOptions" :key="option.id" :value="option.id">
          {{ option.label }}
        </option>
      </select>
    </div>
    
    <div class="filter-section">
      <h4>Groups</h4>
      <div class="groups-filter">
        <div class="search-groups">
          <input 
            type="text" 
            v-model="groupSearch" 
            placeholder="Search groups..." 
            class="group-search-input"
          />
        </div>
        
        <div class="groups-list" v-if="filteredGroups.length > 0">
          <label v-for="group in filteredGroups" :key="group.id" class="group-checkbox">
            <input 
              type="checkbox" 
              :checked="isGroupSelected(group.id)"
              @change="toggleGroup(group.id)"
            />
            <div class="group-info">
              <img :src="group.avatar || '/images/default-group.png'" alt="Group" class="group-avatar" />
              <span class="group-name">{{ group.name }}</span>
            </div>
          </label>
        </div>
        
        <div v-else class="no-groups">
          No groups found
        </div>
      </div>
    </div>
    
    <div class="filter-section" v-if="userFriends.length > 0">
      <h4>Friends</h4>
      <div class="friends-filter">
        <div class="search-friends">
          <input 
            type="text" 
            v-model="friendSearch" 
            placeholder="Search friends..." 
            class="friend-search-input"
          />
        </div>
        
        <div class="friends-list">
          <label v-for="friend in filteredFriends" :key="friend.id" class="friend-checkbox">
            <input 
              type="checkbox" 
              :checked="isFriendSelected(friend.id)"
              @change="toggleFriend(friend.id)"
            />
            <div class="friend-info">
              <img :src="friend.avatar || '/images/default-avatar.png'" alt="Friend" class="friend-avatar" />
              <span class="friend-name">{{ friend.name }}</span>
            </div>
          </label>
        </div>
      </div>
    </div>
    
    <div class="filter-section">
      <h4>Date Range</h4>
      <div class="date-range">
        <select v-model="modelValue.dateRange" @change="updateModelValue" class="date-select">
          <option v-for="range in dateRanges" :key="range.id" :value="range.id">
            {{ range.label }}
          </option>
        </select>
      </div>
    </div>
    
    <div class="filter-actions">
      <button class="reset-filters" @click="resetFilters">Reset Filters</button>
      <button class="apply-filters" @click="applyFilters">Apply Filters</button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      viewType: 'card',
      contentTypes: ['posts', 'photos', 'videos', 'events'],
      sortBy: 'recent',
      selectedGroups: [],
      selectedFriends: [],
      dateRange: 'all'
    })
  },
  userGroups: {
    type: Array,
    default: () => []
  },
  userFriends: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue', 'apply']);

// Search states
const groupSearch = ref('');
const friendSearch = ref('');

// Filter options
const viewOptions = [
  { id: 'card', label: 'Card View', icon: '🃏' },
  { id: 'compact', label: 'Compact', icon: '📃' },
  { id: 'grid', label: 'Grid', icon: '📊' },
  { id: 'magazine', label: 'Magazine', icon: '📰' }
];

const contentTypes = [
  { id: 'posts', label: 'Posts' },
  { id: 'photos', label: 'Photos' },
  { id: 'videos', label: 'Videos' },
  { id: 'events', label: 'Events' },
  { id: 'polls', label: 'Polls & Quizzes' },
  { id: 'articles', label: 'Articles' }
];

const sortOptions = [
  { id: 'recent', label: 'Most Recent' },
  { id: 'popular', label: 'Most Popular' },
  { id: 'trending', label: 'Trending' },
  { id: 'engagement', label: 'Most Engagement' },
  { id: 'relevant', label: 'Most Relevant to You' }
];

const dateRanges = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' }
];

// Computed properties
const filteredGroups = computed(() => {
  if (!groupSearch.value) return props.userGroups;
  
  return props.userGroups.filter(group => 
    group.name.toLowerCase().includes(groupSearch.value.toLowerCase())
  );
});

const filteredFriends = computed(() => {
  if (!friendSearch.value) return props.userFriends;
  
  return props.userFriends.filter(friend => 
    friend.name.toLowerCase().includes(friendSearch.value.toLowerCase())
  );
});

// Helper methods
const isContentTypeSelected = (typeId) => {
  return props.modelValue.contentTypes.includes(typeId);
};

const isGroupSelected = (groupId) => {
  return props.modelValue.selectedGroups.includes(groupId);
};

const isFriendSelected = (friendId) => {
  return props.modelValue.selectedFriends.includes(friendId);
};

// Update methods
const updateViewType = (viewType) => {
  emit('update:modelValue', {
    ...props.modelValue,
    viewType
  });
};

const toggleContentType = (typeId) => {
  let contentTypes = [...props.modelValue.contentTypes];
  
  if (isContentTypeSelected(typeId)) {
    contentTypes = contentTypes.filter(id => id !== typeId);
  } else {
    contentTypes.push(typeId);
  }
  
  emit('update:modelValue', {
    ...props.modelValue,
    contentTypes
  });
};

const toggleGroup = (groupId) => {
  let selectedGroups = [...props.modelValue.selectedGroups];
  
  if (isGroupSelected(groupId)) {
    selectedGroups = selectedGroups.filter(id => id !== groupId);
  } else {
    selectedGroups.push(groupId);
  }
  
  emit('update:modelValue', {
    ...props.modelValue,
    selectedGroups
  });
};

const toggleFriend = (friendId) => {
  let selectedFriends = [...props.modelValue.selectedFriends];
  
  if (isFriendSelected(friendId)) {
    selectedFriends = selectedFriends.filter(id => id !== friendId);
  } else {
    selectedFriends.push(friendId);
  }
  
  emit('update:modelValue', {
    ...props.modelValue,
    selectedFriends
  });
};

const updateModelValue = () => {
  emit('update:modelValue', props.modelValue);
};

const resetFilters = () => {
  emit('update:modelValue', {
    viewType: 'card',
    contentTypes: ['posts', 'photos', 'videos', 'events'],
    sortBy: 'recent',
    selectedGroups: [],
    selectedFriends: [],
    dateRange: 'all'
  });
};

const applyFilters = () => {
  emit('apply', props.modelValue);
};

// Reset search when props change
watch(() => props.userGroups, () => {
  groupSearch.value = '';
});

watch(() => props.userFriends, () => {
  friendSearch.value = '';
});
</script>

<style scoped>
.feed-filters {
  background-color: var(--bg-color, #fff);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.filters-title {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  color: var(--text-color, #1f2937);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  padding-bottom: 10px;
}

.filter-section {
  margin-bottom: 1.5rem;
}

.filter-section h4 {
  font-size: 1rem;
  margin-bottom: 0.8rem;
  color: var(--text-color, #1f2937);
}

.view-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.view-option {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  background-color: var(--bg-alt-color, #f3f4f6);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.view-option:hover {
  background-color: var(--hover-color, #e5e7eb);
}

.view-option.active {
  background-color: var(--primary-color, #3b82f6);
  color: white;
  border-color: var(--primary-color, #3b82f6);
}

.view-icon {
  font-size: 1.1rem;
}

.content-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 6px 10px;
  background-color: var(--bg-alt-color, #f3f4f6);
  border-radius: 6px;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.filter-checkbox:hover {
  background-color: var(--hover-color, #e5e7eb);
}

.sort-select, .date-select {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #e5e7eb);
  background-color: var(--bg-color, white);
  font-size: 0.9rem;
  color: var(--text-color, #1f2937);
}

.groups-filter, .friends-filter {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-groups, .search-friends {
  margin-bottom: 10px;
}

.group-search-input, .friend-search-input {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #e5e7eb);
  font-size: 0.9rem;
}

.groups-list, .friends-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 5px;
}

.group-checkbox, .friend-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  background-color: var(--bg-alt-color, #f3f4f6);
  cursor: pointer;
  transition: background-color 0.2s;
}

.group-checkbox:hover, .friend-checkbox:hover {
  background-color: var(--hover-color, #e5e7eb);
}

.group-info, .friend-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.group-avatar, .friend-avatar {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  object-fit: cover;
}

.group-name, .friend-name {
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-groups {
  padding: 20px;
  text-align: center;
  color: var(--gray-color, #6b7280);
  font-size: 0.9rem;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.reset-filters, .apply-filters {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.reset-filters {
  background-color: var(--gray-color, #6b7280);
  color: white;
}

.reset-filters:hover {
  background-color: var(--gray-dark, #4b5563);
}

.apply-filters {
  background-color: var(--primary-color, #3b82f6);
  color: white;
}

.apply-filters:hover {
  background-color: var(--primary-dark, #2563eb);
}

/* For custom checkbox styling */
input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid var(--border-color, #d1d5db);
  outline: none;
  cursor: pointer;
  position: relative;
  background-color: white;
}

input[type="checkbox"]:checked {
  background-color: var(--primary-color, #3b82f6);
  border-color: var(--primary-color, #3b82f6);
}

input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  top: 1px;
  left: 5px;
  transform: rotate(45deg);
}

/* Scrollbar styling */
.groups-list::-webkit-scrollbar, .friends-list::-webkit-scrollbar {
  width: 6px;
}

.groups-list::-webkit-scrollbar-track, .friends-list::-webkit-scrollbar-track {
  background: var(--bg-alt-color, #f3f4f6);
  border-radius: 10px;
}

.groups-list::-webkit-scrollbar-thumb, .friends-list::-webkit-scrollbar-thumb {
  background: var(--gray-color, #9ca3af);
  border-radius: 10px;
}

/* Responsive design */
@media (max-width: 768px) {
  .view-option {
    padding: 6px 10px;
    font-size: 0.8rem;
  }
  
  .filter-checkbox {
    padding: 5px 8px;
    font-size: 0.8rem;
  }
  
  .group-avatar, .friend-avatar {
    width: 20px;
    height: 20px;
  }
  
  .group-name, .friend-name {
    font-size: 0.8rem;
  }
}
</style> 