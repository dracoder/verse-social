<template>
  <div class="connections-container">
    <div class="connections-header">
      <h3>{{ title }}</h3>
      
      <div class="search-bar">
        <input 
          type="text" 
          v-model="searchQuery" 
          :placeholder="`Search ${relationshipType}...`" 
          @input="handleSearch"
        />
        <button v-if="searchQuery" class="clear-btn" @click="clearSearch">×</button>
        <span class="search-icon">🔍</span>
      </div>
    </div>
    
    <div class="tab-nav">
      <button 
        v-for="tab in availableTabs" 
        :key="tab.value"
        class="tab-btn"
        :class="{ 'active': currentTab === tab.value }"
        @click="setTab(tab.value)"
      >
        {{ tab.label }}
        <span v-if="tabCounts[tab.value]" class="tab-count">{{ tabCounts[tab.value] }}</span>
      </button>
    </div>
    
    <div v-if="loading" class="connections-loading">
      <div class="loading-spinner"></div>
      <p>Loading...</p>
    </div>
    
    <div v-else-if="searchActive && searchResults.length === 0" class="no-results">
      <div class="no-results-icon">🔍</div>
      <p>No results found for "{{ searchQuery }}"</p>
      <button class="clear-search-btn" @click="clearSearch">Clear search</button>
    </div>
    
    <div v-else-if="currentConnections.length === 0" class="empty-state">
      <div class="empty-icon">
        <span v-if="currentTab === 'connections'">👋</span>
        <span v-else-if="currentTab === 'pending'">⏳</span>
        <span v-else-if="currentTab === 'requests'">📩</span>
        <span v-else-if="currentTab === 'suggested'">✨</span>
        <span v-else>👥</span>
      </div>
      <p>{{ getEmptyStateMessage() }}</p>
      
      <button v-if="currentTab === 'suggested'" class="action-btn primary" @click="findMore">
        Find More People
      </button>
    </div>
    
    <div v-else class="connections-list">
      <div 
        v-for="connection in currentConnections" 
        :key="connection.id"
        class="connection-item"
        :class="{ 'has-unread': connection.hasUnread }"
      >
        <div class="connection-avatar">
          <img :src="connection.avatar" :alt="connection.name" />
          <div 
            v-if="showOnlineStatus && connection.status" 
            class="status-indicator"
            :class="`status-${connection.status}`"
            :title="connection.status"
          ></div>
        </div>
        
        <div class="connection-info">
          <div class="connection-name">
            {{ connection.name }}
            <span v-if="connection.verified" class="verified-badge" title="Verified">✓</span>
          </div>
          
          <div class="connection-meta">
            <div v-if="connection.mutualConnections" class="mutual-connections">
              {{ connection.mutualConnections }} mutual {{ connection.mutualConnections === 1 ? 'connection' : 'connections' }}
            </div>
            <div v-else-if="connection.requestTime" class="request-time">
              {{ formatTime(connection.requestTime) }}
            </div>
            <div v-else class="connection-subtitle">
              {{ connection.subtitle || '&nbsp;' }}
            </div>
          </div>
        </div>
        
        <div class="connection-actions">
          <div v-if="currentTab === 'connections'">
            <button 
              class="action-btn secondary message-btn"
              @click="messageUser(connection)"
              title="Send Message"
            >
              💬
            </button>
            <button 
              class="action-btn subtle"
              @click="removeConnection(connection)"
              title="Remove Connection"
            >
              ✕
            </button>
          </div>
          
          <div v-else-if="currentTab === 'pending'">
            <button 
              class="action-btn subtle cancel-btn"
              @click="cancelRequest(connection)"
            >
              Cancel
            </button>
          </div>
          
          <div v-else-if="currentTab === 'requests'" class="request-actions">
            <button 
              class="action-btn primary accept-btn"
              @click="acceptRequest(connection)"
            >
              Accept
            </button>
            <button 
              class="action-btn subtle"
              @click="rejectRequest(connection)"
            >
              Decline
            </button>
          </div>
          
          <div v-else-if="currentTab === 'suggested' || currentTab === 'search'">
            <button 
              v-if="!connection.isPending"
              class="action-btn primary connect-btn"
              @click="sendRequest(connection)"
            >
              Connect
            </button>
            <button 
              v-else
              class="action-btn subtle pending-btn"
              @click="cancelRequest(connection)"
            >
              Pending
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="hasMoreConnections && !searchActive" class="load-more">
        <button 
          class="load-more-btn"
          :disabled="loadingMore"
          @click="loadMoreConnections"
        >
          <span v-if="loadingMore" class="loading-spinner small"></span>
          <span v-else>Load more</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { formatDistanceToNow } from 'date-fns';

const props = defineProps({
  title: {
    type: String,
    default: 'Connections'
  },
  relationshipType: {
    type: String,
    default: 'connections', // connections, friends, followers
    validator: (val) => ['connections', 'friends', 'followers'].includes(val)
  },
  connections: {
    type: Array,
    default: () => []
  },
  pendingRequests: {
    type: Array,
    default: () => []
  },
  receivedRequests: {
    type: Array,
    default: () => []
  },
  suggestedConnections: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingMore: {
    type: Boolean,
    default: false
  },
  hasMoreConnections: {
    type: Boolean,
    default: false
  },
  showOnlineStatus: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits([
  'send-request',
  'cancel-request', 
  'accept-request', 
  'reject-request', 
  'remove-connection',
  'message-user',
  'find-more',
  'load-more',
  'search',
  'tab-change'
]);

// State
const currentTab = ref('connections');
const searchQuery = ref('');
const searchTimeout = ref(null);
const searchResults = ref([]);
const searchActive = ref(false);

// Computed properties
const availableTabs = computed(() => {
  const tabs = [
    { label: props.relationshipType === 'followers' ? 'Followers' : 'Connections', value: 'connections' }
  ];
  
  if (props.relationshipType !== 'followers') {
    tabs.push({ label: 'Pending', value: 'pending' });
    tabs.push({ label: 'Requests', value: 'requests' });
  }
  
  tabs.push({ label: 'Suggested', value: 'suggested' });
  
  return tabs;
});

const tabCounts = computed(() => {
  return {
    connections: props.connections.length,
    pending: props.pendingRequests.length,
    requests: props.receivedRequests.length,
    suggested: props.suggestedConnections.length
  };
});

const currentConnections = computed(() => {
  if (searchActive.value) {
    return searchResults.value;
  }
  
  switch (currentTab.value) {
    case 'connections':
      return props.connections;
    case 'pending':
      return props.pendingRequests;
    case 'requests':
      return props.receivedRequests;
    case 'suggested':
      return props.suggestedConnections;
    default:
      return props.connections;
  }
});

// Methods
const setTab = (tab) => {
  currentTab.value = tab;
  // Clear search when changing tabs
  clearSearch();
  emit('tab-change', tab);
};

const handleSearch = () => {
  // Debounce search
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value);
  }
  
  searchTimeout.value = setTimeout(() => {
    if (searchQuery.value.trim()) {
      searchActive.value = true;
      
      // Search logic depends on current tab
      let sourcesToSearch = [];
      
      if (currentTab.value === 'connections') {
        sourcesToSearch = props.connections;
      } else if (currentTab.value === 'pending') {
        sourcesToSearch = props.pendingRequests;
      } else if (currentTab.value === 'requests') {
        sourcesToSearch = props.receivedRequests;
      } else if (currentTab.value === 'suggested') {
        sourcesToSearch = props.suggestedConnections;
      }
      
      // Simple client-side search
      const query = searchQuery.value.toLowerCase();
      searchResults.value = sourcesToSearch.filter(connection => 
        connection.name.toLowerCase().includes(query)
      );
      
      // Emit search event for potential server-side search
      emit('search', { query: searchQuery.value, tab: currentTab.value });
    } else {
      clearSearch();
    }
  }, 300);
};

const clearSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  searchActive.value = false;
};

const messageUser = (connection) => {
  emit('message-user', connection);
};

const sendRequest = (connection) => {
  emit('send-request', connection);
};

const cancelRequest = (connection) => {
  emit('cancel-request', connection);
};

const acceptRequest = (connection) => {
  emit('accept-request', connection);
};

const rejectRequest = (connection) => {
  emit('reject-request', connection);
};

const removeConnection = (connection) => {
  emit('remove-connection', connection);
};

const findMore = () => {
  emit('find-more');
};

const loadMoreConnections = () => {
  emit('load-more', currentTab.value);
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch (error) {
    return timestamp;
  }
};

const getEmptyStateMessage = () => {
  switch (currentTab.value) {
    case 'connections':
      return `You don't have any ${props.relationshipType} yet`;
    case 'pending':
      return 'No pending requests';
    case 'requests':
      return 'No incoming requests';
    case 'suggested':
      return 'No suggested connections at the moment';
    default:
      return 'No results to display';
  }
};

// Reset component when props change
watch(() => props.relationshipType, () => {
  currentTab.value = 'connections';
  clearSearch();
});
</script>

<style scoped>
.connections-container {
  background-color: var(--bg-color, white);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  font-family: var(--font-family, 'Inter', sans-serif);
}

.connections-header {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.connections-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color, #1f2937);
}

.search-bar {
  position: relative;
  width: 220px;
}

.search-bar input {
  width: 100%;
  padding: 8px 15px 8px 35px;
  border-radius: 20px;
  border: 1px solid var(--border-color, #e5e7eb);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-bar input:focus {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.9rem;
  color: var(--text-muted, #9ca3af);
  pointer-events: none;
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1rem;
  color: var(--text-muted, #9ca3af);
  cursor: pointer;
  transition: color 0.2s;
}

.clear-btn:hover {
  color: var(--text-color, #1f2937);
}

.tab-nav {
  display: flex;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  background-color: var(--bg-alt-color, #f9fafb);
}

.tab-btn {
  flex: 1;
  padding: 12px 5px;
  text-align: center;
  background: none;
  border: none;
  font-size: 0.95rem;
  color: var(--text-muted, #6b7280);
  cursor: pointer;
  position: relative;
  transition: color 0.2s;
}

.tab-btn:hover {
  color: var(--text-color, #1f2937);
}

.tab-btn.active {
  color: var(--primary-color, #3b82f6);
  font-weight: 500;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--primary-color, #3b82f6);
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background-color: var(--primary-color, #3b82f6);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  margin-left: 5px;
  padding: 0 5px;
}

.connections-loading, .empty-state, .no-results {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted, #6b7280);
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border-color, #e5e7eb);
  border-top-color: var(--primary-color, #3b82f6);
  border-radius: 50%;
  margin: 0 auto 15px;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
  border-width: 2px;
  display: inline-block;
  vertical-align: middle;
  margin: 0;
}

.empty-icon, .no-results-icon {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.connection-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
  transition: background-color 0.2s;
}

.connection-item:hover {
  background-color: var(--hover-color, rgba(0, 0, 0, 0.02));
}

.connection-item.has-unread {
  background-color: var(--highlight-color, rgba(59, 130, 246, 0.05));
}

.connection-avatar {
  position: relative;
  margin-right: 15px;
}

.connection-avatar img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
}

.status-online { background-color: #10b981; }
.status-busy { background-color: #ef4444; }
.status-away { background-color: #f59e0b; }
.status-offline { background-color: #9ca3af; }

.connection-info {
  flex: 1;
  min-width: 0;
}

.connection-name {
  font-weight: 600;
  color: var(--text-color, #1f2937);
  margin-bottom: 3px;
  display: flex;
  align-items: center;
}

.verified-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--primary-color, #3b82f6);
  color: white;
  font-size: 0.7rem;
  margin-left: 5px;
}

.connection-meta {
  font-size: 0.85rem;
  color: var(--text-muted, #6b7280);
}

.mutual-connections {
  display: flex;
  align-items: center;
}

.mutual-connections::before {
  content: '👥';
  margin-right: 5px;
  font-size: 0.9rem;
}

.connection-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  white-space: nowrap;
}

.action-btn.primary {
  background-color: var(--primary-color, #3b82f6);
  color: white;
}

.action-btn.primary:hover {
  background-color: var(--primary-dark, #2563eb);
}

.action-btn.secondary {
  background-color: var(--bg-alt-color, #f3f4f6);
  color: var(--text-color, #1f2937);
}

.action-btn.secondary:hover {
  background-color: var(--hover-color, #e5e7eb);
}

.action-btn.subtle {
  background: none;
  color: var(--text-muted, #6b7280);
}

.action-btn.subtle:hover {
  background-color: var(--hover-color, rgba(0, 0, 0, 0.05));
  color: var(--text-color, #1f2937);
}

.message-btn, .cancel-btn {
  padding: 6px 10px;
}

.request-actions {
  display: flex;
  gap: 8px;
}

.clear-search-btn, .action-btn.primary {
  margin-top: 10px;
  padding: 8px 16px;
}

.load-more {
  padding: 15px;
  text-align: center;
}

.load-more-btn {
  padding: 8px 20px;
  background-color: var(--bg-alt-color, #f3f4f6);
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.load-more-btn:hover {
  background-color: var(--hover-color, #e5e7eb);
}

.load-more-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .connections-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .search-bar {
    width: 100%;
  }
  
  .tab-btn {
    font-size: 0.85rem;
    padding: 10px 5px;
  }
  
  .connection-actions {
    flex-direction: column;
    gap: 5px;
  }
  
  .request-actions {
    flex-direction: column;
    gap: 5px;
  }
}
</style> 