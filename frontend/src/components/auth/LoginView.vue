<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';

const store = useStore();
const router = useRouter();
const route = useRoute();

// Form data
const form = ref({
  email: '',
  password: '',
  remember: false
});

// UI state
const isLoading = ref(false);
const error = ref(null);

// Redirect path (if user was redirected to login)
const redirectPath = computed(() => route.query.redirect || '/feed');

// Submit login form
const handleLogin = async () => {
  // Reset error state
  error.value = null;
  isLoading.value = true;
  
  try {
    // Call login action from auth store module
    await store.dispatch('auth/login', form.value);
    
    // Redirect after successful login
    router.push(redirectPath.value);
  } catch (err) {
    // Handle login error
    error.value = err.response?.data?.message || 'Login failed. Please check your credentials.';
  } finally {
    isLoading.value = false;
  }
};

// Navigate to register page
const goToRegister = () => {
  router.push({ name: 'Register', query: route.query });
};
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">Welcome Back</h1>
        <p class="login-subtitle">Sign in to continue to Verse</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <!-- Error alert -->
        <div v-if="error" class="error-alert">
          {{ error }}
        </div>
        
        <!-- Email field -->
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="form.email" 
            required 
            placeholder="Enter your email"
            :disabled="isLoading"
          >
        </div>
        
        <!-- Password field -->
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="form.password" 
            required 
            placeholder="Enter your password"
            :disabled="isLoading"
          >
        </div>
        
        <!-- Remember me checkbox -->
        <div class="form-group checkbox">
          <input 
            type="checkbox" 
            id="remember" 
            v-model="form.remember"
            :disabled="isLoading"
          >
          <label for="remember">Remember me</label>
        </div>
        
        <!-- Submit button -->
        <button 
          type="submit" 
          class="login-button" 
          :disabled="isLoading"
        >
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>
      
      <div class="login-footer">
        <p>Don't have an account? <a href="#" @click.prevent="goToRegister">Sign up</a></p>
        <p><a href="#">Forgot password?</a></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: var(--bg-color, #f5f8fa);
}

.login-card {
  width: 100%;
  max-width: 450px;
  padding: 2.5rem;
  border-radius: 12px;
  background-color: var(--card-bg, white);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary, #333);
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: var(--text-secondary, #666);
  font-size: 1rem;
}

.login-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary, #333);
}

.form-group input[type="email"],
.form-group input[type="password"] {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: var(--primary-color, #4f46e5);
  outline: none;
}

.form-group.checkbox {
  display: flex;
  align-items: center;
}

.form-group.checkbox input {
  margin-right: 0.5rem;
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  background-color: var(--primary-color, #4f46e5);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.login-button:hover {
  background-color: var(--primary-dark, #4338ca);
}

.login-button:disabled {
  background-color: var(--disabled-color, #a5a5a5);
  cursor: not-allowed;
}

.login-footer {
  text-align: center;
  color: var(--text-secondary, #666);
}

.login-footer a {
  color: var(--primary-color, #4f46e5);
  text-decoration: none;
  font-weight: 500;
}

.login-footer a:hover {
  text-decoration: underline;
}

.error-alert {
  background-color: var(--error-bg, #fee2e2);
  color: var(--error-text, #b91c1c);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1.25rem;
  font-size: 0.875rem;
}

@media (max-width: 640px) {
  .login-card {
    padding: 1.5rem;
  }
  
  .login-title {
    font-size: 1.5rem;
  }
}
</style>