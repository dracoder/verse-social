<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';

const store = useStore();
const router = useRouter();
const route = useRoute();

// Form data
const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  terms_accepted: false
});

// UI state
const isLoading = ref(false);
const errors = ref({});
const generalError = ref(null);

// Redirect path (if user was redirected to register)
const redirectPath = computed(() => route.query.redirect || '/feed');

// Password validation
const passwordsMatch = computed(() => {
  if (!form.value.password || !form.value.password_confirmation) return true;
  return form.value.password === form.value.password_confirmation;
});

// Submit registration form
const handleRegister = async () => {
  // Reset error states
  errors.value = {};
  generalError.value = null;
  
  // Validate passwords match
  if (!passwordsMatch.value) {
    errors.value.password_confirmation = 'Passwords do not match';
    return;
  }
  
  // Validate terms acceptance
  if (!form.value.terms_accepted) {
    errors.value.terms_accepted = 'You must accept the terms and conditions';
    return;
  }
  
  isLoading.value = true;
  
  try {
    // Call register action from auth store module
    await store.dispatch('auth/register', {
      name: form.value.name,
      email: form.value.email,
      password: form.value.password,
      password_confirmation: form.value.password_confirmation
    });
    
    // Redirect after successful registration
    router.push(redirectPath.value);
  } catch (err) {
    // Handle validation errors
    if (err.response?.status === 422) {
      errors.value = err.response.data.errors || {};
    } else {
      // Handle general error
      generalError.value = err.response?.data?.message || 'Registration failed. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
};

// Navigate to login page
const goToLogin = () => {
  router.push({ name: 'Login', query: route.query });
};
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h1 class="register-title">Create an Account</h1>
        <p class="register-subtitle">Join Verse and connect with others</p>
      </div>
      
      <form @submit.prevent="handleRegister" class="register-form">
        <!-- General error alert -->
        <div v-if="generalError" class="error-alert">
          {{ generalError }}
        </div>
        
        <!-- Name field -->
        <div class="form-group">
          <label for="name">Full Name</label>
          <input 
            type="text" 
            id="name" 
            v-model="form.name" 
            required 
            placeholder="Enter your full name"
            :disabled="isLoading"
          >
          <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
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
          <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
        </div>
        
        <!-- Password field -->
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="form.password" 
            required 
            placeholder="Create a password"
            :disabled="isLoading"
          >
          <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
        </div>
        
        <!-- Confirm Password field -->
        <div class="form-group">
          <label for="password_confirmation">Confirm Password</label>
          <input 
            type="password" 
            id="password_confirmation" 
            v-model="form.password_confirmation" 
            required 
            placeholder="Confirm your password"
            :disabled="isLoading"
            :class="{ 'input-error': !passwordsMatch && form.password_confirmation }"
          >
          <span v-if="errors.password_confirmation" class="error-text">{{ errors.password_confirmation }}</span>
        </div>
        
        <!-- Terms checkbox -->
        <div class="form-group checkbox">
          <input 
            type="checkbox" 
            id="terms" 
            v-model="form.terms_accepted"
            :disabled="isLoading"
          >
          <label for="terms">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></label>
          <span v-if="errors.terms_accepted" class="error-text block">{{ errors.terms_accepted }}</span>
        </div>
        
        <!-- Submit button -->
        <button 
          type="submit" 
          class="register-button" 
          :disabled="isLoading"
        >
          {{ isLoading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>
      
      <div class="register-footer">
        <p>Already have an account? <a href="#" @click.prevent="goToLogin">Sign in</a></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: var(--bg-color, #f5f8fa);
}

.register-card {
  width: 100%;
  max-width: 500px;
  padding: 2.5rem;
  border-radius: 12px;
  background-color: var(--card-bg, white);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.register-header {
  text-align: center;
  margin-bottom: 2rem;
}

.register-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary, #333);
  margin-bottom: 0.5rem;
}

.register-subtitle {
  color: var(--text-secondary, #666);
  font-size: 1rem;
}

.register-form {
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

.form-group input[type="text"],
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

.input-error {
  border-color: var(--error-color, #dc2626) !important;
}

.form-group.checkbox {
  display: flex;
  align-items: flex-start;
}

.form-group.checkbox input {
  margin-right: 0.5rem;
  margin-top: 0.25rem;
}

.form-group.checkbox label {
  margin-bottom: 0;
  line-height: 1.4;
}

.form-group.checkbox a {
  color: var(--primary-color, #4f46e5);
  text-decoration: none;
}

.form-group.checkbox a:hover {
  text-decoration: underline;
}

.register-button {
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

.register-button:hover {
  background-color: var(--primary-dark, #4338ca);
}

.register-button:disabled {
  background-color: var(--disabled-color, #a5a5a5);
  cursor: not-allowed;
}

.register-footer {
  text-align: center;
  color: var(--text-secondary, #666);
}

.register-footer a {
  color: var(--primary-color, #4f46e5);
  text-decoration: none;
  font-weight: 500;
}

.register-footer a:hover {
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

.error-text {
  display: block;
  color: var(--error-text, #b91c1c);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.block {
  display: block;
  margin-top: 0.5rem;
  margin-left: 1.75rem;
}

@media (max-width: 640px) {
  .register-card {
    padding: 1.5rem;
  }
  
  .register-title {
    font-size: 1.5rem;
  }
}
</style>