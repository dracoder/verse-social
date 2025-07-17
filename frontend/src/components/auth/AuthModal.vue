<script setup>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'login',
    validator: (value) => ['login', 'register'].includes(value)
  }
});

const emit = defineEmits(['close', 'success']);

const store = useStore();
const router = useRouter();

// Local state
const activeTab = ref(props.mode);
const isLoading = ref(false);
const error = ref(null);

// Login form
const loginForm = ref({
  email: '',
  password: '',
  remember: false
});

// Register form
const registerForm = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  terms_accepted: false
});

// Watch for prop changes
watch(() => props.mode, (newMode) => {
  activeTab.value = newMode;
});

// Password validation
const passwordsMatch = computed(() => {
  if (!registerForm.value.password || !registerForm.value.password_confirmation) return true;
  return registerForm.value.password === registerForm.value.password_confirmation;
});

// Handle login submission
const handleLogin = async () => {
  error.value = null;
  isLoading.value = true;
  
  try {
    await store.dispatch('auth/login', loginForm.value);
    emit('success');
    resetForms();
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed. Please check your credentials.';
  } finally {
    isLoading.value = false;
  }
};

// Handle register submission
const handleRegister = async () => {
  error.value = null;
  
  // Validate passwords match
  if (!passwordsMatch.value) {
    error.value = 'Passwords do not match';
    return;
  }
  
  // Validate terms acceptance
  if (!registerForm.value.terms_accepted) {
    error.value = 'You must accept the terms and conditions';
    return;
  }
  
  isLoading.value = true;
  
  try {
    await store.dispatch('auth/register', {
      name: registerForm.value.name,
      email: registerForm.value.email,
      password: registerForm.value.password,
      password_confirmation: registerForm.value.password_confirmation
    });
    emit('success');
    resetForms();
  } catch (err) {
    if (err.response?.status === 422) {
      // Format validation errors
      const validationErrors = err.response.data.errors;
      const errorMessages = [];
      
      for (const field in validationErrors) {
        errorMessages.push(validationErrors[field][0]);
      }
      
      error.value = errorMessages.join('\n');
    } else {
      error.value = err.response?.data?.message || 'Registration failed. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
};

// Reset forms
const resetForms = () => {
  loginForm.value = {
    email: '',
    password: '',
    remember: false
  };
  
  registerForm.value = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    terms_accepted: false
  };
  
  error.value = null;
};

// Close modal
const closeModal = () => {
  emit('close');
  resetForms();
};

// Switch between login and register tabs
const switchTab = (tab) => {
  activeTab.value = tab;
  error.value = null;
};

// Navigate to full page auth
const goToFullPage = (route) => {
  emit('close');
  router.push(route);
};
</script>

<template>
  <div v-if="show" class="auth-modal-overlay" @click="closeModal">
    <div class="auth-modal" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="tabs">
          <button 
            :class="['tab-button', { active: activeTab === 'login' }]" 
            @click="switchTab('login')"
          >
            Sign In
          </button>
          <button 
            :class="['tab-button', { active: activeTab === 'register' }]" 
            @click="switchTab('register')"
          >
            Sign Up
          </button>
        </div>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>
      
      <!-- Modal Content -->
      <div class="modal-content">
        <!-- Error Message -->
        <div v-if="error" class="error-alert">
          {{ error }}
        </div>
        
        <!-- Login Form -->
        <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="login-email">Email</label>
            <input 
              type="email" 
              id="login-email" 
              v-model="loginForm.email" 
              required 
              placeholder="Enter your email"
              :disabled="isLoading"
            >
          </div>
          
          <div class="form-group">
            <label for="login-password">Password</label>
            <input 
              type="password" 
              id="login-password" 
              v-model="loginForm.password" 
              required 
              placeholder="Enter your password"
              :disabled="isLoading"
            >
          </div>
          
          <div class="form-group checkbox">
            <input 
              type="checkbox" 
              id="login-remember" 
              v-model="loginForm.remember"
              :disabled="isLoading"
            >
            <label for="login-remember">Remember me</label>
          </div>
          
          <button 
            type="submit" 
            class="submit-button" 
            :disabled="isLoading"
          >
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
          
          <div class="form-footer">
            <a href="#" @click.prevent="goToFullPage('/login')">Go to full login page</a>
          </div>
        </form>
        
        <!-- Register Form -->
        <form v-else @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label for="register-name">Full Name</label>
            <input 
              type="text" 
              id="register-name" 
              v-model="registerForm.name" 
              required 
              placeholder="Enter your full name"
              :disabled="isLoading"
            >
          </div>
          
          <div class="form-group">
            <label for="register-email">Email</label>
            <input 
              type="email" 
              id="register-email" 
              v-model="registerForm.email" 
              required 
              placeholder="Enter your email"
              :disabled="isLoading"
            >
          </div>
          
          <div class="form-group">
            <label for="register-password">Password</label>
            <input 
              type="password" 
              id="register-password" 
              v-model="registerForm.password" 
              required 
              placeholder="Create a password"
              :disabled="isLoading"
            >
          </div>
          
          <div class="form-group">
            <label for="register-password-confirm">Confirm Password</label>
            <input 
              type="password" 
              id="register-password-confirm" 
              v-model="registerForm.password_confirmation" 
              required 
              placeholder="Confirm your password"
              :disabled="isLoading"
              :class="{ 'input-error': !passwordsMatch && registerForm.password_confirmation }"
            >
          </div>
          
          <div class="form-group checkbox">
            <input 
              type="checkbox" 
              id="register-terms" 
              v-model="registerForm.terms_accepted"
              :disabled="isLoading"
            >
            <label for="register-terms">I agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a></label>
          </div>
          
          <button 
            type="submit" 
            class="submit-button" 
            :disabled="isLoading"
          >
            {{ isLoading ? 'Creating Account...' : 'Create Account' }}
          </button>
          
          <div class="form-footer">
            <a href="#" @click.prevent="goToFullPage('/register')">Go to full registration page</a>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.auth-modal {
  width: 100%;
  max-width: 450px;
  background-color: var(--card-bg, white);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: modal-appear 0.3s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color, #eee);
}

.tabs {
  display: flex;
  gap: 1rem;
}

.tab-button {
  background: none;
  border: none;
  padding: 0.5rem 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-secondary, #666);
  cursor: pointer;
  position: relative;
}

.tab-button.active {
  color: var(--primary-color, #4f46e5);
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--primary-color, #4f46e5);
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary, #666);
  cursor: pointer;
}

.modal-content {
  padding: 1.5rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--text-primary, #333);
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="password"] {
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
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.form-group.checkbox label {
  font-weight: normal;
}

.form-group.checkbox a {
  color: var(--primary-color, #4f46e5);
  text-decoration: none;
}

.form-group.checkbox a:hover {
  text-decoration: underline;
}

.submit-button {
  padding: 0.75rem;
  background-color: var(--primary-color, #4f46e5);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 0.5rem;
}

.submit-button:hover {
  background-color: var(--primary-dark, #4338ca);
}

.submit-button:disabled {
  background-color: var(--disabled-color, #a5a5a5);
  cursor: not-allowed;
}

.form-footer {
  text-align: center;
  margin-top: 1rem;
  font-size: 0.875rem;
}

.form-footer a {
  color: var(--primary-color, #4f46e5);
  text-decoration: none;
}

.form-footer a:hover {
  text-decoration: underline;
}

.error-alert {
  background-color: var(--error-bg, #fee2e2);
  color: var(--error-text, #b91c1c);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

@media (max-width: 640px) {
  .auth-modal {
    max-width: 100%;
    height: auto;
    max-height: 90vh;
    overflow-y: auto;
  }
}
</style>