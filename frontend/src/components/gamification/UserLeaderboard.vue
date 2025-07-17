<template>
  <div class="leaderboard-container">
    <div class="leaderboard-header">
      <h3>{{ title }}</h3>
      <div class="time-selector">
        <button 
          v-for="period in timePeriods" 
          :key="period.value"
          class="time-btn"
          :class="{ 'active': selectedPeriod === period.value }"
          @click="setPeriod(period.value)"
        >
          {{ period.label }}
        </button>
      </div>
    </div>
    
    <div class="tab-selector">
      <button 
        v-for="tab in tabs" 
        :key="tab.value"
        class="tab-btn"
        :class="{ 'active': selectedTab === tab.value }"
        @click="setTab(tab.value)"
      >
        {{ tab.label }}
        <span class="tab-indicator"></span>
      </button>
    </div>
    
    <div v-if="loading" class="leaderboard-loading">
      <div class="loading-spinner"></div>
      <p>Loading leaderboard...</p>
    </div>
    
    <div v-else class="leaderboard-content">
      <!-- Top 3 users podium -->
      <div v-if="showTopThree && topUsers.length > 0" class="top-users-podium">
        <div class="podium-positions">
          <div v-if="topUsers[1]" class="podium-user second-place">
            <div class="position-badge">2</div>
            <div class="user-avatar-wrapper">
              <img :src="topUsers[1].avatar" :alt="topUsers[1].name" class="user-avatar" />
              <div class="rank-badge silver">2</div>
            </div>
            <div class="user-name">{{ topUsers[1].name }}</div>
            <div class="user-score">{{ topUsers[1].score }}</div>
          </div>
          
          <div v-if="topUsers[0]" class="podium-user first-place">
            <div class="position-badge">1</div>
            <div class="user-avatar-wrapper">
              <img :src="topUsers[0].avatar" :alt="topUsers[0].name" class="user-avatar" />
              <div class="rank-badge gold">1</div>
              <div class="winner-crown">👑</div>
            </div>
            <div class="user-name">{{ topUsers[0].name }}</div>
            <div class="user-score">{{ topUsers[0].score }}</div>
          </div>
          
          <div v-if="topUsers[2]" class="podium-user third-place">
            <div class="position-badge">3</div>
            <div class="user-avatar-wrapper">
              <img :src="topUsers[2].avatar" :alt="topUsers[2].name" class="user-avatar" />
              <div class="rank-badge bronze">3</div>
            </div>
            <div class="user-name">{{ topUsers[2].name }}</div>
            <div class="user-score">{{ topUsers[2].score }}</div>
          </div>
        </div>
        
        <div class="podium-base">
          <div class="podium-block second">2</div>
          <div class="podium-block first">1</div>
          <div class="podium-block third">3</div>
        </div>
      </div>
      
      <!-- Leaderboard list -->
      <div class="leaderboard-list">
        <div v-if="users.length === 0" class="empty-list">
          <p>No data available for this time period</p>
        </div>
        
        <div 
          v-for="(user, index) in users" 
          :key="user.id"
          class="leaderboard-row"
          :class="{ 
            'is-current-user': user.isCurrentUser,
            'is-top-three': index < 3 && !showTopThree
          }"
        >
          <div class="rank-column">
            <div class="rank-number">{{ showTopThree ? index + 4 : index + 1 }}</div>
            <div v-if="user.rankChange !== 0" class="rank-change" :class="getRankChangeClass(user.rankChange)">
              {{ getRankChangeText(user.rankChange) }}
            </div>
          </div>
          
          <div class="user-column">
            <img :src="user.avatar" :alt="user.name" class="user-avatar" />
            <div class="user-info">
              <div class="user-name">
                {{ user.name }}
                <span v-if="user.isCurrentUser" class="current-user-marker">(You)</span>
              </div>
              <div class="user-stats">
                <div class="stat-item">
                  <span class="stat-label">Level:</span>
                  <span class="stat-value">{{ user.level }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">{{ user.scoreLabel || 'Points' }}:</span>
                  <span class="stat-value">{{ user.score }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="badges-column">
            <div v-if="user.badges && user.badges.length > 0" class="user-badges">
              <div 
                v-for="(badge, badgeIndex) in user.badges.slice(0, 3)" 
                :key="badgeIndex"
                class="badge-icon"
                :title="badge.name"
              >
                <img :src="badge.icon" :alt="badge.name" />
              </div>
              <div v-if="user.badges.length > 3" class="more-badges">
                +{{ user.badges.length - 3 }}
              </div>
            </div>
          </div>
          
          <div class="score-column">
            <div class="score-value">{{ user.score }}</div>
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ width: `${getProgressPercentage(user)}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Current user's rank if not in view -->
      <div v-if="currentUserRank && !isCurrentUserVisible" class="current-user-rank">
        <div class="divider">
          <span class="dots">•••</span>
        </div>
        
        <div class="leaderboard-row is-current-user">
          <div class="rank-column">
            <div class="rank-number">{{ currentUserRank.position }}</div>
            <div v-if="currentUserRank.rankChange !== 0" class="rank-change" :class="getRankChangeClass(currentUserRank.rankChange)">
              {{ getRankChangeText(currentUserRank.rankChange) }}
            </div>
          </div>
          
          <div class="user-column">
            <img :src="currentUserRank.avatar" :alt="currentUserRank.name" class="user-avatar" />
            <div class="user-info">
              <div class="user-name">
                {{ currentUserRank.name }}
                <span class="current-user-marker">(You)</span>
              </div>
              <div class="user-stats">
                <div class="stat-item">
                  <span class="stat-label">Level:</span>
                  <span class="stat-value">{{ currentUserRank.level }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">{{ currentUserRank.scoreLabel || 'Points' }}:</span>
                  <span class="stat-value">{{ currentUserRank.score }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="badges-column">
            <div v-if="currentUserRank.badges && currentUserRank.badges.length > 0" class="user-badges">
              <div 
                v-for="(badge, badgeIndex) in currentUserRank.badges.slice(0, 3)" 
                :key="badgeIndex"
                class="badge-icon"
                :title="badge.name"
              >
                <img :src="badge.icon" :alt="badge.name" />
              </div>
              <div v-if="currentUserRank.badges.length > 3" class="more-badges">
                +{{ currentUserRank.badges.length - 3 }}
              </div>
            </div>
          </div>
          
          <div class="score-column">
            <div class="score-value">{{ currentUserRank.score }}</div>
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ width: `${getProgressPercentage(currentUserRank)}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: 'Leaderboard'
  },
  users: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  currentUserId: {
    type: [String, Number],
    default: null
  },
  showTopThree: {
    type: Boolean,
    default: true
  },
  maxScore: {
    type: Number,
    default: 1000
  }
});

const emit = defineEmits(['period-change', 'tab-change']);

// State
const selectedPeriod = ref('week');
const selectedTab = ref('points');

// Tab options
const tabs = [
  { label: 'Points', value: 'points' },
  { label: 'Activity', value: 'activity' },
  { label: 'Contributions', value: 'contributions' }
];

// Time period options
const timePeriods = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'All Time', value: 'all' }
];

// Computed properties
const topUsers = computed(() => {
  return props.users.slice(0, 3);
});

const isCurrentUserVisible = computed(() => {
  return props.users.some(user => user.id === props.currentUserId);
});

const currentUserRank = computed(() => {
  if (!props.currentUserId) return null;
  
  // If the current user is not in the visible list, return their rank info
  const allUsers = props.users;
  const fullUsersList = props.fullUsersList || allUsers;
  const currentUser = fullUsersList.find(user => user.id === props.currentUserId);
  
  if (currentUser && !isCurrentUserVisible.value) {
    return {
      ...currentUser,
      position: fullUsersList.findIndex(user => user.id === props.currentUserId) + 1
    };
  }
  
  return null;
});

// Methods
const setPeriod = (period) => {
  selectedPeriod.value = period;
  emit('period-change', period);
};

const setTab = (tab) => {
  selectedTab.value = tab;
  emit('tab-change', tab);
};

const getRankChangeClass = (change) => {
  if (change > 0) return 'rank-up';
  if (change < 0) return 'rank-down';
  return '';
};

const getRankChangeText = (change) => {
  if (change > 0) return `+${change}`;
  return change;
};

const getProgressPercentage = (user) => {
  const score = user.score || 0;
  const nextLevelScore = user.nextLevelScore || props.maxScore;
  const currentLevelScore = user.currentLevelScore || 0;
  
  if (nextLevelScore === currentLevelScore) return 100;
  
  const scoreRange = nextLevelScore - currentLevelScore;
  const userProgress = score - currentLevelScore;
  
  return Math.min(100, Math.max(0, (userProgress / scoreRange) * 100));
};
</script>

<style scoped>
.leaderboard-container {
  background-color: var(--bg-color, white);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  font-family: var(--font-family, 'Inter', sans-serif);
  width: 100%;
}

.leaderboard-header {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.leaderboard-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-color, #1f2937);
}

.time-selector {
  display: flex;
  gap: 5px;
  background-color: var(--bg-alt-color, #f3f4f6);
  border-radius: 8px;
  padding: 3px;
}

.time-btn {
  padding: 6px 12px;
  border: none;
  background: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-muted, #6b7280);
}

.time-btn:hover {
  color: var(--text-color, #1f2937);
}

.time-btn.active {
  background-color: white;
  color: var(--primary-color, #3b82f6);
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.tab-selector {
  display: flex;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.tab-btn {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  font-size: 0.95rem;
  cursor: pointer;
  position: relative;
  color: var(--text-muted, #6b7280);
  transition: color 0.2s;
}

.tab-btn:hover {
  color: var(--text-color, #1f2937);
}

.tab-btn.active {
  color: var(--primary-color, #3b82f6);
  font-weight: 500;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--primary-color, #3b82f6);
  transform: scaleX(0);
  transition: transform 0.2s;
}

.tab-btn.active .tab-indicator {
  transform: scaleX(1);
}

.leaderboard-loading {
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

.top-users-podium {
  padding: 30px 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.podium-positions {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  margin-bottom: 15px;
  width: 100%;
  max-width: 400px;
}

.podium-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 10px;
  position: relative;
}

.user-avatar-wrapper {
  position: relative;
  margin-bottom: 10px;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.first-place .user-avatar {
  width: 70px;
  height: 70px;
  border: 3px solid #ffd700;
}

.second-place .user-avatar {
  width: 55px;
  height: 55px;
  border: 2px solid #c0c0c0;
}

.third-place .user-avatar {
  width: 50px;
  height: 50px;
  border: 2px solid #cd7f32;
}

.winner-crown {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.rank-badge {
  position: absolute;
  bottom: -5px;
  right: -5px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  border: 2px solid white;
}

.gold {
  background-color: #ffd700;
}

.silver {
  background-color: #c0c0c0;
}

.bronze {
  background-color: #cd7f32;
}

.position-badge {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-muted, #6b7280);
}

.user-name {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 5px;
  text-align: center;
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.first-place .user-name {
  color: var(--primary-color, #3b82f6);
}

.user-score {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted, #6b7280);
}

.first-place .user-score {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color, #1f2937);
}

.podium-base {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  height: 60px;
  width: 100%;
  max-width: 320px;
}

.podium-block {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  position: relative;
}

.podium-block.first {
  background-color: rgba(255, 215, 0, 0.3);
  border-top: 3px solid #ffd700;
  height: 60px;
  width: 40%;
  z-index: 3;
}

.podium-block.second {
  background-color: rgba(192, 192, 192, 0.3);
  border-top: 3px solid #c0c0c0;
  height: 45px;
  width: 30%;
  z-index: 2;
}

.podium-block.third {
  background-color: rgba(205, 127, 50, 0.3);
  border-top: 3px solid #cd7f32;
  height: 30px;
  width: 30%;
  z-index: 1;
}

.leaderboard-list {
  padding: 10px 0;
}

.empty-list {
  padding: 20px;
  text-align: center;
  color: var(--text-muted, #6b7280);
}

.leaderboard-row {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.04));
  transition: background-color 0.2s;
}

.leaderboard-row:hover {
  background-color: var(--hover-color, rgba(0, 0, 0, 0.02));
}

.leaderboard-row.is-current-user {
  background-color: var(--selected-bg, rgba(59, 130, 246, 0.08));
}

.leaderboard-row.is-top-three {
  background-color: var(--top-user-bg, rgba(0, 0, 0, 0.02));
}

.rank-column {
  width: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.rank-number {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-color, #1f2937);
}

.is-top-three:nth-child(1) .rank-number {
  color: #ffd700;
}

.is-top-three:nth-child(2) .rank-number {
  color: #c0c0c0;
}

.is-top-three:nth-child(3) .rank-number {
  color: #cd7f32;
}

.rank-change {
  font-size: 0.75rem;
  margin-top: 2px;
}

.rank-up {
  color: var(--success-color, #10b981);
}

.rank-down {
  color: var(--error-color, #ef4444);
}

.user-column {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  margin-left: 10px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
}

.user-info {
  min-width: 0;
}

.user-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color, #1f2937);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.current-user-marker {
  font-size: 0.8rem;
  font-weight: 400;
  color: var(--primary-color, #3b82f6);
  margin-left: 5px;
}

.user-stats {
  display: flex;
  gap: 10px;
  margin-top: 2px;
}

.stat-item {
  font-size: 0.8rem;
  color: var(--text-muted, #6b7280);
}

.stat-label {
  margin-right: 2px;
}

.stat-value {
  font-weight: 500;
}

.badges-column {
  margin-right: 15px;
}

.user-badges {
  display: flex;
  align-items: center;
}

.badge-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-left: -5px;
  border: 1px solid white;
  overflow: hidden;
}

.badge-icon:first-child {
  margin-left: 0;
}

.badge-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.more-badges {
  font-size: 0.75rem;
  color: var(--text-muted, #6b7280);
  margin-left: 5px;
}

.score-column {
  text-align: right;
  min-width: 80px;
}

.score-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color, #1f2937);
  margin-bottom: 5px;
}

.progress-bar {
  height: 4px;
  background-color: var(--bg-alt-color, #f3f4f6);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color, #3b82f6);
  border-radius: 2px;
}

.is-current-user .progress-fill {
  background-color: var(--success-color, #10b981);
}

.current-user-rank {
  margin-top: 10px;
}

.divider {
  text-align: center;
  padding: 5px 0;
  color: var(--text-muted, #6b7280);
}

.dots {
  letter-spacing: 3px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .leaderboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .time-selector {
    width: 100%;
    justify-content: space-between;
  }
  
  .podium-positions {
    max-width: 300px;
  }
  
  .first-place .user-avatar {
    width: 60px;
    height: 60px;
  }
  
  .second-place .user-avatar, .third-place .user-avatar {
    width: 45px;
    height: 45px;
  }
  
  .badges-column {
    display: none;
  }
  
  .user-name {
    max-width: 100px;
  }
}
</style> 