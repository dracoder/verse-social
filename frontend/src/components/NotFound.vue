<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

// Navigate back to home
const goHome = () => {
  router.push('/');
};
</script>

<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">Page Not Found</h2>
      <p class="error-message">The page you are looking for doesn't exist or has been moved.</p>
      <button @click="goHome" class="home-button">Go to Home</button>
    </div>
  </div>
</template>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: var(--bg-color);
  text-align: center;
}

.not-found-content {
  max-width: 500px;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0;
  line-height: 1;
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  margin: 16px 0;
  color: var(--text-color);
}

.error-message {
  font-size: 18px;
  color: #666;
  margin-bottom: 32px;
}

.home-button {
  padding: 12px 24px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.home-button:hover {
  background-color: var(--primary-hover);
}

/* Dark mode adjustments */
:deep(.dark-mode) .error-message {
  color: #a0a0a0;
}
</style>