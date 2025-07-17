<script setup>
import { computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import AppLayout from './components/layout/AppLayout.vue';
import { subscribeToNotifications } from './services/echo';

const store = useStore();
const router = useRouter();

// Computed properties
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
const currentUser = computed(() => store.getters['auth/currentUser']);
const isDarkMode = computed(() => store.getters['isDarkMode']);

// Subscribe to notifications when user is authenticated
let notificationChannel = null;

watch(isAuthenticated, (newValue) => {
  if (newValue && currentUser.value) {
    subscribeToUserNotifications();
  } else if (notificationChannel) {
    // Disconnect if user logs out
    notificationChannel = null;
  }
}, { immediate: true });

// Subscribe to user notifications
const subscribeToUserNotifications = () => {
  if (!currentUser.value) return;
  
  notificationChannel = subscribeToNotifications(currentUser.value.id, (notification) => {
    // Add notification to store
    store.commit('notifications/ADD_NOTIFICATION', notification);
    
    // Show notification toast or alert
    // This could be implemented with a toast library or custom component
    console.log('New notification:', notification);
  });
};

// Initialize when mounted
onMounted(() => {
  if (isAuthenticated.value && currentUser.value) {
    subscribeToUserNotifications();
  }
});
</script>

<template>
  <div :class="['app-wrapper', { 'dark-mode': isDarkMode }]">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<style>
/* Global styles */
:root {
  --primary-color: #646cff;
  --primary-hover: #535bf2;
  --text-color: #213547;
  --bg-color: #ffffff;
  --card-bg: #f9f9f9;
  --border-color: #e5e7eb;
  --success-color: #10b981;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
}

.dark-mode {
  --text-color: rgba(255, 255, 255, 0.87);
  --bg-color: #242424;
  --card-bg: #1a1a1a;
  --border-color: #374151;
}

body {
  color: var(--text-color);
  background-color: var(--bg-color);
  transition: color 0.3s, background-color 0.3s;
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

#app {
  width: 100%;
  min-height: 100vh;
}

.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .hide-on-mobile {
    display: none;
  }
}
</style>
