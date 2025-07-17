import { createRouter, createWebHistory } from 'vue-router';

// Import components
import LandingPage from '../components/landing/LandingPage.vue';
import GroupList from '../components/groups/GroupList.vue';
import GroupDetail from '../components/groups/GroupDetail.vue';
import ProfileView from '../components/profile/ProfileView.vue';

// Define routes
const routes = [
  {
    path: '/',
    name: 'Home',
    component: LandingPage
  },
  {
    path: '/groups',
    name: 'GroupList',
    component: GroupList
  },
  {
    path: '/groups/:slug',
    name: 'GroupDetail',
    component: GroupDetail,
    props: true
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView
  },
  {
    path: '/profile/:id',
    name: 'UserProfile',
    component: ProfileView,
    props: true
  },
  {
    path: '/login',
    name: 'Login',
    // We'll create this component later
    component: () => import('../components/auth/LoginView.vue')
  },
  {
    path: '/register',
    name: 'Register',
    // We'll create this component later
    component: () => import('../components/auth/RegisterView.vue')
  },
  {
    path: '/feed',
    name: 'Feed',
    // We'll create this component later
    component: () => import('../components/feed/FeedView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    // We'll create this component later
    component: () => import('../components/NotFound.vue')
  }
];

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guards
router.beforeEach((to, from, next) => {
  // Check if the route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // Check if user is authenticated
    const store = window.app?.$store;
    const isAuthenticated = store ? store.getters['auth/isAuthenticated'] : false;
    
    if (!isAuthenticated) {
      // Redirect to login page if not authenticated
      next({ name: 'Login', query: { redirect: to.fullPath } });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;