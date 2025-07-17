<template>
  <div class="onboarding-container" v-if="isVisible">
    <div class="onboarding-overlay" @click="skipOnboarding"></div>
    
    <div class="onboarding-content">
      <div class="onboarding-header">
        <h2>{{ currentStep.title }}</h2>
        <button class="close-btn" @click="skipOnboarding">×</button>
      </div>
      
      <div class="progress-bar">
        <div class="progress-track">
          <div 
            class="progress-fill" 
            :style="{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }"
          ></div>
        </div>
        <div class="progress-steps">
          <div 
            v-for="(step, index) in steps" 
            :key="index"
            class="progress-step"
            :class="{ 'completed': index <= currentStepIndex, 'active': index === currentStepIndex }"
            @click="goToStep(index)"
          >
            <div class="step-dot"></div>
            <span class="step-label">{{ step.shortTitle || step.title }}</span>
          </div>
        </div>
      </div>
      
      <div class="step-content">
        <img 
          v-if="currentStep.image" 
          :src="currentStep.image" 
          :alt="currentStep.title" 
          class="step-image"
        />
        
        <div class="step-description">
          <p>{{ currentStep.description }}</p>
        </div>
        
        <div v-if="currentStep.interactive" class="interactive-section">
          <component 
            :is="currentStep.component" 
            v-bind="currentStep.props" 
            @completed="markStepCompleted"
          />
        </div>
      </div>
      
      <div class="onboarding-footer">
        <button 
          v-if="currentStepIndex > 0" 
          class="btn btn-secondary"
          @click="prevStep"
        >
          Back
        </button>
        
        <div class="spacer"></div>
        
        <button 
          v-if="currentStepIndex < steps.length - 1" 
          class="btn btn-primary"
          :disabled="currentStep.requiresCompletion && !isCurrentStepCompleted"
          @click="nextStep"
        >
          Next
        </button>
        
        <button 
          v-else 
          class="btn btn-success"
          @click="finishOnboarding"
        >
          Get Started
        </button>
      </div>
    </div>
    
    <!-- Floating help button -->
    <button 
      v-if="showHelpButton"
      class="help-button"
      @click="showHelp"
    >
      <span class="help-icon">?</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import ProfileDecorations from '../profile/ProfileDecorations.vue';
import GroupCustomizer from '../groups/GroupCustomizer.vue';
import FeedFilters from '../feed/FeedFilters.vue';

const props = defineProps({
  isActive: {
    type: Boolean,
    default: true
  },
  startAtStep: {
    type: Number,
    default: 0
  },
  showHelpButton: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['complete', 'skip', 'step-change']);

const router = useRouter();

// State
const isVisible = ref(props.isActive);
const currentStepIndex = ref(props.startAtStep);
const completedSteps = ref(new Set());

// Define onboarding steps
const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Verse!',
    shortTitle: 'Welcome',
    description: 'We\'re excited to have you join our creative social platform! Let\'s take a quick tour to help you get the most out of your experience.',
    image: '/images/onboarding/welcome.png',
    interactive: false
  },
  {
    id: 'profile-decoration',
    title: 'Personalize Your Profile',
    shortTitle: 'Profile',
    description: 'Make your profile uniquely yours! Choose themes, add decorations, and create a space that reflects your personality.',
    image: '/images/onboarding/profile.png',
    interactive: true,
    component: ProfileDecorations,
    props: {
      modelValue: {
        theme: 'default',
        backgroundType: 'solid',
        backgroundColor: '#f0f2f5',
        backgroundImage: '',
        animatedBackground: '',
        profileDecorations: [],
        mood: 'neutral',
        fontStyle: 'default'
      }
    },
    requiresCompletion: true
  },
  {
    id: 'groups',
    title: 'Discover Communities',
    shortTitle: 'Groups',
    description: 'Join groups based on your interests to connect with like-minded people. You can also create your own group and customize it!',
    image: '/images/onboarding/groups.png',
    interactive: true,
    component: GroupCustomizer,
    props: {
      modelValue: {
        theme: 'default',
        coverImage: '',
        customStyles: {
          primaryColor: '#3b82f6',
          textColor: '#1f2937',
          fontFamily: 'Inter, sans-serif'
        },
        groupDecorations: [],
        allowCustomEmojis: false,
        customEmojis: []
      }
    },
    requiresCompletion: false
  },
  {
    id: 'feed',
    title: 'Customize Your Feed',
    shortTitle: 'Feed',
    description: 'Tailor your home feed to show exactly what you\'re interested in. Filter by content type, sort order, and more!',
    image: '/images/onboarding/feed.png',
    interactive: true,
    component: FeedFilters,
    props: {
      modelValue: {
        viewType: 'card',
        contentTypes: ['posts', 'photos', 'videos', 'events'],
        sortBy: 'recent',
        selectedGroups: [],
        selectedFriends: [],
        dateRange: 'all'
      },
      userGroups: [
        { id: 1, name: 'Photography Enthusiasts', avatar: '/images/groups/photography.png' },
        { id: 2, name: 'Book Club', avatar: '/images/groups/books.png' },
        { id: 3, name: 'Travel Adventures', avatar: '/images/groups/travel.png' }
      ],
      userFriends: [
        { id: 1, name: 'Alex Johnson', avatar: '/images/avatars/alex.png' },
        { id: 2, name: 'Jamie Smith', avatar: '/images/avatars/jamie.png' },
        { id: 3, name: 'Taylor Wong', avatar: '/images/avatars/taylor.png' }
      ]
    },
    requiresCompletion: false
  },
  {
    id: 'notifications',
    title: 'Real-time Updates',
    shortTitle: 'Notifications',
    description: 'Stay connected with real-time notifications about activities, comments, and interactions that matter to you.',
    image: '/images/onboarding/notifications.png',
    interactive: false
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    shortTitle: 'Complete',
    description: 'Congratulations! You\'re ready to start exploring Verse. Dive in and start connecting, sharing, and creating!',
    image: '/images/onboarding/complete.png',
    interactive: false
  }
];

// Computed properties
const currentStep = computed(() => steps[currentStepIndex.value]);
const isCurrentStepCompleted = computed(() => 
  !currentStep.value.requiresCompletion || completedSteps.value.has(currentStep.value.id)
);

// Navigation methods
const nextStep = () => {
  if (currentStepIndex.value < steps.length - 1) {
    currentStepIndex.value++;
    emit('step-change', currentStepIndex.value, steps[currentStepIndex.value].id);
  }
};

const prevStep = () => {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--;
    emit('step-change', currentStepIndex.value, steps[currentStepIndex.value].id);
  }
};

const goToStep = (index) => {
  if (index >= 0 && index < steps.length) {
    currentStepIndex.value = index;
    emit('step-change', currentStepIndex.value, steps[currentStepIndex.value].id);
  }
};

const markStepCompleted = () => {
  completedSteps.value.add(currentStep.value.id);
};

const skipOnboarding = () => {
  isVisible.value = false;
  emit('skip');
};

const finishOnboarding = () => {
  isVisible.value = false;
  emit('complete');
  
  // Redirect to home page
  router.push('/');
};

const showHelp = () => {
  // Logic to show specific help for the current step
  alert(`Help for ${currentStep.value.title}: ${currentStep.value.description}`);
};

// Watch for prop changes
watch(() => props.isActive, (newValue) => {
  isVisible.value = newValue;
});

watch(() => props.startAtStep, (newValue) => {
  if (newValue >= 0 && newValue < steps.length) {
    currentStepIndex.value = newValue;
  }
});

// Keyboard navigation
const handleKeydown = (event) => {
  if (!isVisible.value) return;
  
  if (event.key === 'ArrowRight' || event.key === 'Enter') {
    if (currentStepIndex.value < steps.length - 1) {
      nextStep();
    } else {
      finishOnboarding();
    }
  } else if (event.key === 'ArrowLeft') {
    prevStep();
  } else if (event.key === 'Escape') {
    skipOnboarding();
  }
};

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.onboarding-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.onboarding-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
}

.onboarding-content {
  position: relative;
  width: 90%;
  max-width: 800px;
  background-color: var(--bg-color, white);
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.3s ease;
}

.onboarding-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.onboarding-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-color, #1f2937);
}

.close-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-alt-color, #f3f4f6);
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: var(--hover-color, #e5e7eb);
}

.progress-bar {
  padding: 0 20px;
  margin-bottom: 20px;
}

.progress-track {
  height: 6px;
  background-color: var(--bg-alt-color, #f3f4f6);
  border-radius: 3px;
  margin-bottom: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color, #3b82f6);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-steps {
  display: flex;
  justify-content: space-between;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  flex: 1;
}

.step-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--bg-alt-color, #f3f4f6);
  border: 2px solid var(--border-color, #e5e7eb);
  margin-bottom: 6px;
  transition: all 0.2s;
}

.step-label {
  font-size: 0.75rem;
  color: var(--gray-color, #6b7280);
  text-align: center;
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.2s;
}

.progress-step.completed .step-dot {
  background-color: var(--primary-color, #3b82f6);
  border-color: var(--primary-color, #3b82f6);
}

.progress-step.active .step-dot {
  background-color: var(--primary-color, #3b82f6);
  border-color: var(--primary-color, #3b82f6);
  transform: scale(1.2);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.progress-step.active .step-label {
  color: var(--primary-color, #3b82f6);
  font-weight: 600;
}

.step-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 0 20px 20px;
  max-height: calc(90vh - 200px);
}

.step-image {
  width: 100%;
  max-height: 250px;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 20px;
}

.step-description {
  margin-bottom: 20px;
  color: var(--text-color, #1f2937);
  line-height: 1.6;
}

.interactive-section {
  margin-top: 20px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  padding: 15px;
  background-color: var(--bg-alt-color, #f9fafb);
}

.onboarding-footer {
  padding: 15px 20px;
  border-top: 1px solid var(--border-color, #e5e7eb);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.spacer {
  flex-grow: 1;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.95rem;
}

.btn-secondary {
  background-color: var(--bg-alt-color, #f3f4f6);
  color: var(--text-color, #1f2937);
}

.btn-secondary:hover {
  background-color: var(--hover-color, #e5e7eb);
}

.btn-primary {
  background-color: var(--primary-color, #3b82f6);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-dark, #2563eb);
}

.btn-primary:disabled {
  background-color: var(--gray-color, #9ca3af);
  cursor: not-allowed;
}

.btn-success {
  background-color: var(--success-color, #10b981);
  color: white;
}

.btn-success:hover {
  background-color: var(--success-dark, #059669);
}

.help-button {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: var(--primary-color, #3b82f6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  font-size: 1.5rem;
  font-weight: bold;
  transition: all 0.2s;
  z-index: 10;
}

.help-button:hover {
  transform: scale(1.1);
  background-color: var(--primary-dark, #2563eb);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive styles */
@media (max-width: 768px) {
  .onboarding-content {
    width: 95%;
    max-height: 95vh;
  }
  
  .step-label {
    display: none;
  }
  
  .interactive-section {
    padding: 10px;
  }
  
  .btn {
    padding: 8px 15px;
    font-size: 0.9rem;
  }
  
  .help-button {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }
}
</style> 