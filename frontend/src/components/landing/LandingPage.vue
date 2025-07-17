<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import AuthModal from '../auth/AuthModal.vue';

const store = useStore();
const router = useRouter();

// State
const showAuthModal = ref(false);
const authMode = ref('login'); // 'login' or 'register'

// Computed
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
const currentUser = computed(() => store.getters['auth/currentUser']);

// Methods
const openAuthModal = (mode = 'login') => {
  authMode.value = mode;
  showAuthModal.value = true;
};

const closeAuthModal = () => {
  showAuthModal.value = false;
};

const navigateToAuth = (path) => {
  router.push(path);
};

// Scroll to section
const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

const handleGetStarted = () => {
  if (isAuthenticated.value) {
    router.push('/feed');
  } else {
    openAuthModal('register');
  }
};

const handleAuthSuccess = () => {
  closeAuthModal();
  router.push('/feed');
};
</script>

<template>
  <div class="landing-container">
    <!-- Header for non-authenticated users -->
    <header class="landing-header" v-if="!isAuthenticated">
      <div class="header-container">
        <div class="logo">
          <h2>Verse</h2>
        </div>
        <nav class="nav-links">
          <a href="#features" @click.prevent="scrollToSection('features')">Features</a>
          <a href="#testimonials" @click.prevent="scrollToSection('testimonials')">Testimonials</a>
          <a href="#" @click.prevent="openAuthModal('login')" class="login-link">Login</a>
          <button @click="openAuthModal('register')" class="signup-button">Sign Up</button>
        </nav>
      </div>
    </header>
    
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Connect, Share, and Engage with <span class="highlight">Verse</span></h1>
        <p class="hero-subtitle">A modern social platform designed for meaningful connections and vibrant communities</p>
        
        <div class="cta-buttons">
          <button @click="handleGetStarted" class="primary-button">Get Started</button>
          <button @click="openAuthModal('login')" class="secondary-button" v-if="!isAuthenticated">Already a member?</button>
        </div>
      </div>
      
      <div class="hero-image">
        <div class="app-preview">
          <!-- Stylized app mockup -->
          <div class="mockup-frame">
            <div class="mockup-header">
              <div class="mockup-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <div class="mockup-content">
              <div class="mockup-post">
                <div class="mockup-avatar"></div>
                <div class="mockup-text">
                  <div class="mockup-line"></div>
                  <div class="mockup-line short"></div>
                </div>
              </div>
              <div class="mockup-post">
                <div class="mockup-avatar"></div>
                <div class="mockup-text">
                  <div class="mockup-line"></div>
                  <div class="mockup-line medium"></div>
                </div>
              </div>
              <div class="mockup-post">
                <div class="mockup-avatar"></div>
                <div class="mockup-text">
                  <div class="mockup-line"></div>
                  <div class="mockup-line short"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Features Section -->
    <section id="features" class="features-section">
      <h2 class="section-title">Why Choose Verse?</h2>
      
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">💬</div>
          <h3 class="feature-title">Real-time Chat</h3>
          <p class="feature-description">Connect instantly with friends and groups through our seamless real-time messaging system.</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">📱</div>
          <h3 class="feature-title">Mobile Friendly</h3>
          <p class="feature-description">Access Verse from any device with our responsive design that works perfectly on desktop and mobile.</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🔒</div>
          <h3 class="feature-title">Privacy Focused</h3>
          <p class="feature-description">Your data belongs to you. We prioritize your privacy with robust security measures.</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">👥</div>
          <h3 class="feature-title">Community Groups</h3>
          <p class="feature-description">Create and join groups based on your interests to connect with like-minded people.</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🔔</div>
          <h3 class="feature-title">Smart Notifications</h3>
          <p class="feature-description">Stay updated with intelligent notifications that keep you informed without overwhelming you.</p>
        </div>
        
        <div class="feature-card">
          <div class="feature-icon">🌙</div>
          <h3 class="feature-title">Dark Mode</h3>
          <p class="feature-description">Easy on the eyes with a beautiful dark mode option for comfortable browsing day or night.</p>
        </div>
      </div>
    </section>
    
    <!-- Testimonials Section -->
    <section id="testimonials" class="testimonials-section">
      <h2 class="section-title">What Our Users Say</h2>
      
      <div class="testimonials-container">
        <div class="testimonial-card">
          <div class="testimonial-content">
            <p>"Verse has completely transformed how I stay connected with my friends and colleagues. The interface is intuitive and the features are exactly what I needed!"</p>
          </div>
          <div class="testimonial-author">
            <div class="author-avatar"></div>
            <div class="author-info">
              <h4>Sarah Johnson</h4>
              <p>Designer</p>
            </div>
          </div>
        </div>
        
        <div class="testimonial-card">
          <div class="testimonial-content">
            <p>"The community groups feature is amazing! I've found so many people who share my interests and have made genuine connections."</p>
          </div>
          <div class="testimonial-author">
            <div class="author-avatar"></div>
            <div class="author-info">
              <h4>Michael Chen</h4>
              <p>Developer</p>
            </div>
          </div>
        </div>
        
        <div class="testimonial-card">
          <div class="testimonial-content">
            <p>"I love how Verse respects my privacy while still providing all the social features I want. The dark mode is a game-changer for late-night browsing!"</p>
          </div>
          <div class="testimonial-author">
            <div class="author-avatar"></div>
            <div class="author-info">
              <h4>Emma Rodriguez</h4>
              <p>Student</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Call to Action Section -->
    <section class="cta-section">
      <div class="cta-content">
        <h2 class="cta-title">Ready to join our community?</h2>
        <p class="cta-description">Sign up today and start connecting with people who share your interests.</p>
        <button @click="handleGetStarted" class="cta-button">Join Verse Now</button>
      </div>
    </section>
    
    <!-- Footer -->
    <footer class="landing-footer">
      <div class="footer-content">
        <div class="footer-logo">
          <h2>Verse</h2>
          <p>Connect. Share. Engage.</p>
        </div>
        
        <div class="footer-links">
          <div class="footer-column">
            <h3>Company</h3>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          
          <div class="footer-column">
            <h3>Resources</h3>
            <ul>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Community Guidelines</a></li>
            </ul>
          </div>
          
          <div class="footer-column">
            <h3>Legal</h3>
            <ul>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  </div>
  
  <!-- Auth Modal -->
  <AuthModal 
    :show="showAuthModal" 
    :mode="authMode" 
    @close="closeAuthModal" 
    @success="handleAuthSuccess"
  />
</template>

<style scoped>
/* Base styles */
.landing-container {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  color: var(--text-primary, #333);
  line-height: 1.6;
}

/* Header styles */
.landing-header {
  position: sticky;
  top: 0;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
  box-shadow: 0 1px 10px rgba(0, 0, 0, 0.05);
  padding: 1rem 0;
  z-index: 100;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo h2 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary-color, #4f46e5);
  margin: 0;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-links a {
  color: var(--text-primary, #333);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: var(--primary-color, #4f46e5);
}

.login-link {
  margin-left: 1rem;
}

.signup-button {
  background-color: var(--primary-color, #4f46e5);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.signup-button:hover {
  background-color: var(--primary-dark, #4338ca);
}

/* Hero section */
.hero-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 5rem 2rem;
  gap: 2rem;
}

.hero-content {
  flex: 1;
  max-width: 600px;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 1.5rem;
  color: var(--text-primary, #333);
}

.highlight {
  color: var(--primary-color, #4f46e5);
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--text-secondary, #666);
  margin-bottom: 2.5rem;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
}

.primary-button {
  background-color: var(--primary-color, #4f46e5);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.primary-button:hover {
  background-color: var(--primary-dark, #4338ca);
}

.secondary-button {
  background-color: transparent;
  color: var(--text-primary, #333);
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.secondary-button:hover {
  background-color: var(--bg-hover, #f5f5f5);
  border-color: var(--text-secondary, #666);
}

.hero-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* App mockup */
.app-preview {
  width: 100%;
  max-width: 400px;
}

.mockup-frame {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.mockup-header {
  background-color: #f5f5f5;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}

.mockup-dots {
  display: flex;
  gap: 0.5rem;
}

.mockup-dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #ddd;
}

.mockup-dots span:first-child {
  background-color: #ff5f57;
}

.mockup-dots span:nth-child(2) {
  background-color: #ffbd2e;
}

.mockup-dots span:nth-child(3) {
  background-color: #28c940;
}

.mockup-content {
  padding: 1.5rem;
}

.mockup-post {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.mockup-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e0e7ff;
}

.mockup-text {
  flex: 1;
}

.mockup-line {
  height: 12px;
  background-color: #f3f4f6;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.mockup-line.short {
  width: 70%;
}

.mockup-line.medium {
  width: 85%;
}

/* Features section */
.features-section {
  background-color: var(--bg-alt, #f9fafb);
  padding: 5rem 2rem;
}

.section-title {
  text-align: center;
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 3rem;
  color: var(--text-primary, #333);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1.25rem;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-primary, #333);
}

.feature-description {
  color: var(--text-secondary, #666);
}

/* Testimonials section */
.testimonials-section {
  padding: 5rem 2rem;
  background-color: white;
}

.testimonials-container {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  justify-content: center;
}

.testimonial-card {
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  transition: transform 0.3s;
}

.testimonial-card:hover {
  transform: translateY(-5px);
}

.testimonial-content {
  margin-bottom: 1.5rem;
  font-style: italic;
  color: var(--text-primary, #333);
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.author-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #e0e7ff;
}

.author-info h4 {
  margin: 0;
  font-weight: 600;
  color: var(--text-primary, #333);
}

.author-info p {
  margin: 0;
  color: var(--text-secondary, #666);
  font-size: 0.875rem;
}

/* CTA section */
.cta-section {
  background-color: var(--primary-color, #4f46e5);
  color: white;
  padding: 5rem 2rem;
  text-align: center;
}

.cta-content {
  max-width: 700px;
  margin: 0 auto;
}

.cta-title {
  font-size: 2.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.cta-description {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.cta-button {
  background-color: white;
  color: var(--primary-color, #4f46e5);
  border: none;
  border-radius: 8px;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
}

.cta-button:hover {
  background-color: #f9fafb;
  transform: scale(1.05);
}

/* Footer */
.landing-footer {
  background-color: var(--bg-dark, #1f2937);
  color: white;
  padding: 4rem 2rem;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 3rem;
}

.footer-logo h2 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
}

.footer-logo p {
  opacity: 0.7;
  margin: 0;
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 3rem;
}

.footer-column h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
}

.footer-column ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-column li {
  margin-bottom: 0.75rem;
}

.footer-column a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.2s;
}

.footer-column a:hover {
  color: white;
}

/* Responsive styles */
@media (max-width: 1024px) {
  .hero-section {
    flex-direction: column;
    text-align: center;
    padding: 3rem 2rem;
  }
  
  .hero-content {
    max-width: 100%;
  }
  
  .cta-buttons {
    justify-content: center;
  }
  
  .features-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .header-container {
    padding: 0 1.5rem;
  }
  
  .nav-links {
    gap: 1rem;
  }
  
  .hero-title {
    font-size: 2.25rem;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
  }
  
  .section-title {
    font-size: 1.8rem;
  }
  
  .cta-title {
    font-size: 1.8rem;
  }
  
  .cta-description {
    font-size: 1.1rem;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 2rem;
  }
  
  .footer-links {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 640px) {
  .nav-links a:not(.login-link) {
    display: none;
  }
  
  .hero-section {
    padding: 2rem 1.5rem;
  }
  
  .features-section,
  .testimonials-section,
  .cta-section {
    padding: 3rem 1.5rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .testimonials-container {
    flex-direction: column;
    align-items: center;
  }
  
  .footer-links {
    flex-direction: column;
    gap: 2rem;
  }
}
</style>