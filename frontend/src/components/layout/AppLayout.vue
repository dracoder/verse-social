<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import NotificationsPanel from '../notifications/NotificationsPanel.vue';

const store = useStore();
const router = useRouter();
const route = useRoute();

// Responsive state
const isMobileView = ref(false);
const isSearchActive = ref(false);
const searchQuery = ref('');

// Computed properties
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
const currentUser = computed(() => store.getters['auth/currentUser']);
const isDarkMode = computed(() => store.getters['isDarkMode']);
const isSidebarOpen = computed(() => store.getters['isSidebarOpen']);
const unreadNotifications = computed(() => store.getters['notifications/unreadCount']);

// Active route
const isActive = (routeName) => {
  return route.name === routeName;
};

// Toggle dark mode
const toggleDarkMode = () => {
  store.dispatch('toggleDarkMode');
};

// Toggle sidebar
const toggleSidebar = () => {
  store.dispatch('toggleSidebar');
  
  // Auto-close sidebar on mobile after navigation
  if (isMobileView.value && isSidebarOpen.value) {
    setTimeout(() => {
      store.dispatch('toggleSidebar');
    }, 300);
  }
};

// Toggle search on mobile
const toggleSearch = () => {
  isSearchActive.value = !isSearchActive.value;
  if (isSearchActive.value) {
    // Focus the search input when activated
    setTimeout(() => {
      document.querySelector('.search-input')?.focus();
    }, 100);
  }
};

// Handle search
const handleSearch = () => {
  if (!searchQuery.value.trim()) return;
  
  // Navigate to search results
  router.push({
    name: 'Search',
    query: { q: searchQuery.value }
  });
  
  // Reset and close search on mobile
  if (isMobileView.value) {
    isSearchActive.value = false;
  }
  searchQuery.value = '';
};

// Logout
const logout = async () => {
  try {
    await store.dispatch('auth/logout');
    router.push('/login');
  } catch (err) {
    console.error('Error logging out:', err);
  }
};

// Check if mobile view
const checkMobileView = () => {
  isMobileView.value = window.innerWidth < 768;
  
  // Auto-close sidebar on mobile
  if (isMobileView.value && isSidebarOpen.value) {
    store.dispatch('toggleSidebar');
  }
};

// Lifecycle hooks
onMounted(() => {
  checkMobileView();
  window.addEventListener('resize', checkMobileView);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobileView);
});
</script>

<template>
  <div :class="['app-container', { 'dark-mode': isDarkMode, 'sidebar-closed': !isSidebarOpen, 'mobile-view': isMobileView }]">
    <!-- Navigation bar -->
    <header class="navbar">
      <div class="navbar-left">
        <button @click="toggleSidebar" class="sidebar-toggle" aria-label="Toggle sidebar">
          <i class="menu-icon">☰</i>
        </button>
        <div class="logo" @click="router.push('/')">
          <h1>Verse</h1>
        </div>
      </div>
      
      <div class="navbar-center" :class="{ 'search-active': isSearchActive }">
        <div class="search-bar">
          <input 
            type="text" 
            class="search-input" 
            placeholder="Search..." 
            v-model="searchQuery"
            @keyup.enter="handleSearch"
          />
          <button class="search-button" @click="handleSearch" aria-label="Search">
            <i class="search-icon">🔍</i>
          </button>
        </div>
      </div>
      
      <div class="navbar-right">
        <!-- Mobile search toggle -->
        <button 
          v-if="isMobileView" 
          @click="toggleSearch" 
          class="mobile-search-toggle"
          aria-label="Toggle search"
        >
          <i class="search-icon">🔍</i>
        </button>
        
        <!-- Notifications -->
        <div class="notifications-container">
          <button 
            @click="$refs.notificationsPanel.togglePanel()" 
            class="notifications-button"
            aria-label="Notifications"
          >
            <i class="notification-icon">🔔</i>
            <span v-if="unreadNotifications > 0" class="notification-badge">{{ unreadNotifications }}</span>
          </button>
        </div>
        
        <!-- Dark mode toggle -->
        <button @click="toggleDarkMode" class="theme-toggle" aria-label="Toggle dark mode">
          <i class="theme-icon">{{ isDarkMode ? '☀️' : '🌙' }}</i>
        </button>
        
        <!-- User menu -->
        <div class="user-menu" v-if="isAuthenticated">
          <div class="user-avatar" @click="router.push('/profile')">
            <img 
              v-if="currentUser && currentUser.avatar" 
              :src="currentUser.avatar" 
              alt="User avatar"
            />
            <div v-else class="avatar-placeholder">{{ currentUser ? currentUser.name.charAt(0) : 'U' }}</div>
          </div>
          <button @click="logout" class="logout-button hide-on-mobile">Logout</button>
        </div>
        
        <!-- Auth buttons -->
        <div class="auth-buttons" v-else>
          <button @click="router.push('/login')" class="login-button">Login</button>
          <button @click="router.push('/register')" class="register-button hide-on-mobile">Register</button>
        </div>
      </div>
    </header>
    
    <!-- Sidebar navigation -->
    <aside class="sidebar" :class="{ 'closed': !isSidebarOpen }">
      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li class="nav-item">
            <router-link to="/" class="nav-link" :class="{ 'active': isActive('Home') }">
              <i class="nav-icon">🏠</i>
              <span class="nav-text">Home</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/feed" class="nav-link" :class="{ 'active': isActive('Feed') }">
              <i class="nav-icon">📰</i>
              <span class="nav-text">Feed</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/groups" class="nav-link" :class="{ 'active': isActive('GroupList') }">
              <i class="nav-icon">👥</i>
              <span class="nav-text">Groups</span>
            </router-link>
          </li>
          <li class="nav-item">
            <router-link to="/profile" class="nav-link" :class="{ 'active': isActive('Profile') }">
              <i class="nav-icon">👤</i>
              <span class="nav-text">Profile</span>
            </router-link>
          </li>
          <li class="nav-item" v-if="isAuthenticated">
            <router-link to="/settings" class="nav-link" :class="{ 'active': isActive('Settings') }">
              <i class="nav-icon">⚙️</i>
              <span class="nav-text">Settings</span>
            </router-link>
          </li>
          <li class="nav-item mobile-only" v-if="isAuthenticated">
            <a href="#" class="nav-link" @click.prevent="logout">
              <i class="nav-icon">🚪</i>
              <span class="nav-text">Logout</span>
            </a>
          </li>
          <li class="nav-item mobile-only" v-else>
            <router-link to="/login" class="nav-link">
              <i class="nav-icon">🔑</i>
              <span class="nav-text">Login</span>
            </router-link>
          </li>
          <li class="nav-item mobile-only" v-if="!isAuthenticated">
            <router-link to="/register" class="nav-link">
              <i class="nav-icon">📝</i>
              <span class="nav-text">Register</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </aside>
    
    <!-- Main content -->
    <main class="main-content">
      <router-view />
    </main>
    
    <!-- Notifications panel (using ref to access methods) -->
    <NotificationsPanel ref="notificationsPanel" />
  </div>
</template>

<style scoped>
/* Layout container */
.app-container {
  display: grid;
  grid-template-areas:
    "navbar navbar"
    "sidebar main";
  grid-template-columns: 250px 1fr;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
  transition: all var(--transition-normal);
}

/* Navbar styles */
.navbar {
  grid-area: navbar;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-md);
  height: 60px;
  background-color: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.navbar-left, .navbar-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.navbar-center {
  flex: 1;
  max-width: 600px;
}

.logo h1 {
  margin: 0;
  font-size: var(--font-size-xl);
  cursor: pointer;
}

/* Search bar */
.search-bar {
  display: flex;
  align-items: center;
  background-color: var(--card-bg);
  border-radius: var(--border-radius-full);
  padding: 0 var(--spacing-sm);
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.search-bar:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.2);
}

.search-input {
  flex: 1;
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  font-size: var(--font-size-md);
  color: var(--text-color);
  outline: none;
}

.search-button {
  background: transparent;
  border: none;
  padding: var(--spacing-xs);
  cursor: pointer;
  color: var(--text-color-light);
}

/* Sidebar styles */
.sidebar {
  grid-area: sidebar;
  background-color: var(--bg-color);
  border-right: 1px solid var(--border-color);
  padding: var(--spacing-md) 0;
  overflow-y: auto;
  transition: transform var(--transition-normal);
  height: calc(100vh - 60px);
  position: sticky;
  top: 60px;
}

.sidebar-nav {
  padding: 0 var(--spacing-sm);
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin-bottom: var(--spacing-xs);
}

.nav-link {
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  text-decoration: none;
  color: var(--text-color);
  transition: background-color var(--transition-fast);
}

.nav-link:hover {
  background-color: var(--card-bg);
}

.nav-link.active {
  background-color: var(--primary-color);
  color: white;
}

.nav-icon {
  margin-right: var(--spacing-md);
  font-size: var(--font-size-lg);
}

/* Main content area */
.main-content {
  grid-area: main;
  padding: var(--spacing-lg);
  overflow-y: auto;
}

/* User menu */
.user-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  background-color: var(--card-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-weight: bold;
  font-size: var(--font-size-lg);
  color: var(--primary-color);
}

/* Notification styles */
.notifications-container {
  position: relative;
}

.notifications-button {
  background: transparent;
  border: none;
  font-size: var(--font-size-lg);
  cursor: pointer;
  padding: var(--spacing-xs);
  position: relative;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: var(--error-color);
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  font-size: var(--font-size-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}

/* Auth buttons */
.auth-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.login-button {
  background-color: transparent;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
}

.register-button {
  background-color: var(--primary-color);
  color: white;
}

/* Mobile styles */
.mobile-only {
  display: none;
}

.mobile-search-toggle {
  display: none;
}

/* Responsive styles */
@media (max-width: 768px) {
  .app-container {
    grid-template-areas:
      "navbar"
      "main";
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    position: fixed;
    left: 0;
    top: 60px;
    bottom: 0;
    width: 250px;
    z-index: 90;
    transform: translateX(-100%);
    box-shadow: var(--shadow-lg);
  }
  
  .sidebar.closed {
    transform: translateX(-100%);
  }
  
  .sidebar:not(.closed) {
    transform: translateX(0);
  }
  
  .mobile-only {
    display: block;
  }
  
  .mobile-search-toggle {
    display: block;
  }
  
  .navbar-center {
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    background-color: var(--bg-color);
    padding: var(--spacing-sm);
    border-bottom: 1px solid var(--border-color);
    z-index: 80;
    transform: translateY(-100%);
    transition: transform var(--transition-fast);
  }
  
  .navbar-center.search-active {
    transform: translateY(0);
  }
  
  .search-bar {
    width: 100%;
  }
  
  .logo h1 {
    font-size: var(--font-size-lg);
  }
  
  .main-content {
    padding: var(--spacing-md);
  }
}

/* Dark mode styles */
.dark-mode .navbar,
.dark-mode .sidebar,
.dark-mode .navbar-center {
  background-color: var(--dark-bg-color);
  border-color: var(--dark-border-color);
}

.dark-mode .search-bar {
  background-color: var(--dark-card-bg);
  border-color: var(--dark-border-color);
}

.dark-mode .search-input {
  color: var(--dark-text-color);
}

.dark-mode .nav-link:hover {
  background-color: var(--dark-card-bg);
}

.dark-mode .user-avatar {
  background-color: var(--dark-card-bg);
}
</style>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f0f2f5;
  color: #1c1e21;
  transition: background-color 0.3s, color 0.3s;
}

.app-container.dark-mode {
  background-color: #18191a;
  color: #e4e6eb;
}

/* Navbar styles */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: background-color 0.3s;
}

.dark-mode .navbar {
  background-color: #242526;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.navbar-left, .navbar-right {
  display: flex;
  align-items: center;
}

.navbar-center {
  flex-grow: 1;
  display: flex;
  justify-content: center;
}

.sidebar-toggle {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  margin-right: 15px;
  color: #1877f2;
}

.dark-mode .sidebar-toggle {
  color: #2d88ff;
}

.logo {
  cursor: pointer;
}

.logo h1 {
  margin: 0;
  font-size: 24px;
  color: #1877f2;
}

.dark-mode .logo h1 {
  color: #2d88ff;
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: #f0f2f5;
  border-radius: 20px;
  padding: 0 15px;
  max-width: 400px;
  width: 100%;
  transition: background-color 0.3s;
}

.dark-mode .search-bar {
  background-color: #3a3b3c;
}

.search-bar input {
  background: none;
  border: none;
  padding: 8px 0;
  width: 100%;
  font-size: 14px;
  outline: none;
  color: inherit;
}

.search-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

.theme-toggle {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  margin: 0 15px;
}

.user-menu {
  position: relative;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 200px;
  z-index: 10;
  display: none;
  overflow: hidden;
  transition: background-color 0.3s;
}

.dark-mode .dropdown-menu {
  background-color: #242526;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.user-menu:hover .dropdown-menu {
  display: block;
}

.dropdown-item {
  padding: 12px 15px;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #f0f2f5;
}

.dark-mode .dropdown-item:hover {
  background-color: #3a3b3c;
}

.dropdown-item i {
  margin-right: 10px;
  font-size: 18px;
}

.dropdown-divider {
  height: 1px;
  background-color: #e4e6eb;
  margin: 5px 0;
}

.dark-mode .dropdown-divider {
  background-color: #3a3b3c;
}

.auth-buttons {
  display: flex;
  gap: 10px;
}

.login-button, .register-button {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.login-button {
  background-color: transparent;
  border: 1px solid #1877f2;
  color: #1877f2;
}

.dark-mode .login-button {
  border-color: #2d88ff;
  color: #2d88ff;
}

.register-button {
  background-color: #1877f2;
  border: none;
  color: white;
}

.dark-mode .register-button {
  background-color: #2d88ff;
}

/* Content area styles */
.content-wrapper {
  display: flex;
  flex-grow: 1;
}

.sidebar {
  width: 240px;
  background-color: #fff;
  padding: 20px 0;
  height: calc(100vh - 60px);
  position: sticky;
  top: 60px;
  overflow-y: auto;
  transition: width 0.3s, background-color 0.3s;
}

.dark-mode .sidebar {
  background-color: #242526;
}

.sidebar-closed .sidebar {
  width: 70px;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  border-radius: 8px;
  margin: 0 10px;
  transition: background-color 0.3s;
}

.nav-item:hover {
  background-color: #f0f2f5;
}

.dark-mode .nav-item:hover {
  background-color: #3a3b3c;
}

.nav-item i {
  font-size: 20px;
  margin-right: 15px;
}

.sidebar-closed .nav-item span {
  display: none;
}

.main-content {
  flex-grow: 1;
  padding: 20px;
  transition: margin-left 0.3s;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .navbar-center {
    display: none;
  }
  
  .sidebar {
    position: fixed;
    left: 0;
    z-index: 90;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }
  
  .sidebar-closed .sidebar {
    transform: translateX(-100%);
  }
  
  .app-container:not(.sidebar-closed) .sidebar {
    transform: translateX(0);
    width: 240px;
  }
  
  .app-container:not(.sidebar-closed) .main-content {
    margin-left: 0;
  }
}
</style>