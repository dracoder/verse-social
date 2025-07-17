<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { subscribeToNotifications } from '../../services/echo';

const store = useStore();
const router = useRouter();

// State variables
const isLoading = ref(false);
const error = ref(null);
const currentPage = ref(1);
const hasMorePosts = ref(true);
const notificationChannel = ref(null);

// Computed properties
const posts = computed(() => store.getters['posts/allPosts']);
const isAuthenticated = computed(() => store.getters['auth/isAuthenticated']);
const currentUser = computed(() => store.getters['auth/currentUser']);
const pagination = computed(() => store.getters['posts/pagination']);

// Load feed posts
const loadFeed = async (page = 1) => {
  if (!isAuthenticated.value) {
    router.push('/login');
    return;
  }
  
  isLoading.value = true;
  error.value = null;
  
  try {
    await store.dispatch('posts/fetchFeed', page);
    currentPage.value = page;
    hasMorePosts.value = page < pagination.value.lastPage;
  } catch (err) {
    error.value = 'Failed to load feed. Please try again.';
    console.error('Error loading feed:', err);
  } finally {
    isLoading.value = false;
  }
};

// Load more posts (pagination)
const loadMore = async () => {
  if (isLoading.value || !hasMorePosts.value) return;
  
  await loadFeed(currentPage.value + 1);
};

// Create a new post
const newPostContent = ref('');
const newPostMedia = ref([]);
const isSubmitting = ref(false);

const handleMediaChange = (event) => {
  newPostMedia.value = Array.from(event.target.files);
};

const createPost = async () => {
  if (!newPostContent.value.trim() && newPostMedia.value.length === 0) return;
  if (isSubmitting.value) return;
  
  isSubmitting.value = true;
  
  try {
    const formData = new FormData();
    formData.append('content', newPostContent.value);
    
    // Add media files if any
    newPostMedia.value.forEach(file => {
      formData.append('media[]', file);
    });
    
    await store.dispatch('posts/createPost', formData);
    
    // Reset form
    newPostContent.value = '';
    newPostMedia.value = [];
    
    // Refresh feed
    await loadFeed(1);
  } catch (err) {
    error.value = 'Failed to create post. Please try again.';
    console.error('Error creating post:', err);
  } finally {
    isSubmitting.value = false;
  }
};

// Like a post
const likePost = async (postId) => {
  try {
    await store.dispatch('posts/toggleLike', postId);
  } catch (err) {
    console.error('Error liking post:', err);
  }
};

// Comment on a post
const commentText = ref({});
const showCommentForm = ref({});

const toggleCommentForm = (postId) => {
  showCommentForm.value = {
    ...showCommentForm.value,
    [postId]: !showCommentForm.value[postId]
  };
  
  if (!commentText.value[postId]) {
    commentText.value[postId] = '';
  }
};

const addComment = async (postId) => {
  if (!commentText.value[postId] || !commentText.value[postId].trim()) return;
  
  try {
    await store.dispatch('posts/addComment', {
      postId,
      content: commentText.value[postId]
    });
    
    // Reset comment form
    commentText.value[postId] = '';
    showCommentForm.value[postId] = false;
  } catch (err) {
    console.error('Error adding comment:', err);
  }
};

// Delete a post
const deletePost = async (postId) => {
  if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
    return;
  }
  
  try {
    await store.dispatch('posts/deletePost', postId);
  } catch (err) {
    console.error('Error deleting post:', err);
  }
};

// Setup real-time notifications
const setupRealtime = () => {
  if (isAuthenticated.value && currentUser.value) {
    notificationChannel.value = subscribeToNotifications(currentUser.value.id, (notification) => {
      // Handle different notification types
      if (notification.type === 'post_created') {
        store.dispatch('posts/receivePost', notification.data.post);
      } else if (notification.type === 'post_liked') {
        store.dispatch('posts/receiveLike', {
          postId: notification.data.post_id,
          userId: notification.data.user_id,
          liked: true
        });
      } else if (notification.type === 'post_commented') {
        store.dispatch('posts/receiveComment', {
          postId: notification.data.post_id,
          comment: notification.data.comment
        });
      }
      
      // Add notification to store
      store.dispatch('notifications/receiveNotification', notification);
    });
  }
};

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Lifecycle hooks
onMounted(() => {
  loadFeed();
  setupRealtime();
});

onUnmounted(() => {
  // Clean up real-time connections
  if (notificationChannel.value) {
    notificationChannel.value.unsubscribe();
  }
});
</script>

<template>
  <div class="feed-container">
    <!-- Create post form -->
    <div v-if="isAuthenticated" class="create-post-card">
      <div class="create-post-header">
        <img 
          :src="currentUser?.profile?.avatar || '/default-avatar.png'" 
          alt="Profile" 
          class="user-avatar"
        >
        <h3>Create Post</h3>
      </div>
      
      <div class="create-post-content">
        <textarea 
          v-model="newPostContent" 
          placeholder="What's on your mind?"
          rows="3"
        ></textarea>
        
        <div v-if="newPostMedia.length > 0" class="media-preview">
          <div 
            v-for="(file, index) in newPostMedia" 
            :key="index"
            class="media-item"
          >
            <span class="file-name">{{ file.name }}</span>
            <button 
              @click="newPostMedia.splice(index, 1)" 
              class="remove-media"
            >
              &times;
            </button>
          </div>
        </div>
        
        <div class="post-actions">
          <div class="media-upload">
            <input 
              type="file" 
              id="post-media" 
              @change="handleMediaChange" 
              multiple
              accept="image/*,video/*"
            >
            <label for="post-media">
              <i class="media-icon">📷</i>
              Add Media
            </label>
          </div>
          
          <button 
            @click="createPost" 
            :disabled="isSubmitting || (!newPostContent.trim() && newPostMedia.length === 0)"
            class="post-button"
          >
            {{ isSubmitting ? 'Posting...' : 'Post' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Error message -->
    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="loadFeed(1)">Try Again</button>
    </div>
    
    <!-- Posts feed -->
    <div v-if="posts.length > 0" class="posts-container">
      <div 
        v-for="post in posts" 
        :key="post.id"
        class="post-card"
      >
        <div class="post-header">
          <div class="post-user-info">
            <img 
              :src="post.user?.profile?.avatar || '/default-avatar.png'" 
              alt="Profile" 
              class="user-avatar"
            >
            <div>
              <h4>{{ post.user?.name }}</h4>
              <span class="post-date">{{ formatDate(post.created_at) }}</span>
              <span v-if="post.group" class="post-group">
                in <a @click="router.push(`/groups/${post.group.slug}`)">{{ post.group.name }}</a>
              </span>
            </div>
          </div>
          
          <div v-if="post.user_id === currentUser?.id" class="post-actions">
            <button @click="deletePost(post.id)" class="delete-button">
              Delete
            </button>
          </div>
        </div>
        
        <div class="post-content">
          <p>{{ post.content }}</p>
          
          <!-- Media display -->
          <div v-if="post.media && post.media.length > 0" class="post-media">
            <div 
              v-for="(media, index) in post.media" 
              :key="index"
              class="media-container"
            >
              <!-- Image -->
              <img 
                v-if="media.type.startsWith('image')" 
                :src="media.url" 
                alt="Post media" 
                class="post-image"
              >
              
              <!-- Video -->
              <video 
                v-else-if="media.type.startsWith('video')" 
                controls
                class="post-video"
              >
                <source :src="media.url" :type="media.type">
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
        
        <div class="post-stats">
          <span>{{ post.likes_count || 0 }} likes</span>
          <span>{{ post.comments_count || 0 }} comments</span>
        </div>
        
        <div class="post-actions-bar">
          <button 
            @click="likePost(post.id)" 
            :class="{ 'liked': post.liked_by_user }"
            class="action-button"
          >
            <i class="like-icon">👍</i>
            Like
          </button>
          
          <button 
            @click="toggleCommentForm(post.id)" 
            class="action-button"
          >
            <i class="comment-icon">💬</i>
            Comment
          </button>
        </div>
        
        <!-- Comments section -->
        <div v-if="post.comments && post.comments.length > 0" class="comments-section">
          <div 
            v-for="comment in post.comments" 
            :key="comment.id"
            class="comment"
          >
            <img 
              :src="comment.user?.profile?.avatar || '/default-avatar.png'" 
              alt="Profile" 
              class="comment-avatar"
            >
            <div class="comment-content">
              <div class="comment-header">
                <h5>{{ comment.user?.name }}</h5>
                <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
              </div>
              <p>{{ comment.content }}</p>
            </div>
          </div>
        </div>
        
        <!-- Comment form -->
        <div v-if="showCommentForm[post.id]" class="comment-form">
          <img 
            :src="currentUser?.profile?.avatar || '/default-avatar.png'" 
            alt="Profile" 
            class="comment-avatar"
          >
          <div class="comment-input-container">
            <textarea 
              v-model="commentText[post.id]" 
              placeholder="Write a comment..."
              rows="2"
            ></textarea>
            <button 
              @click="addComment(post.id)" 
              :disabled="!commentText[post.id] || !commentText[post.id].trim()"
              class="comment-button"
            >
              Comment
            </button>
          </div>
        </div>
      </div>
      
      <!-- Load more button -->
      <div v-if="hasMorePosts" class="load-more">
        <button 
          @click="loadMore" 
          :disabled="isLoading"
          class="load-more-button"
        >
          {{ isLoading ? 'Loading...' : 'Load More' }}
        </button>
      </div>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="!isLoading && !error" class="empty-state">
      <h3>No posts yet</h3>
      <p>Follow users or join groups to see posts in your feed.</p>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading && posts.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Loading posts...</p>
    </div>
  </div>
</template>

<style scoped>
.feed-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.create-post-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  padding: 20px;
}

.create-post-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
}

.create-post-header h3 {
  margin: 0;
  font-size: 18px;
}

.create-post-content textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: none;
  font-size: 16px;
  margin-bottom: 15px;
}

.media-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.media-item {
  background-color: #f0f2f5;
  padding: 8px 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.file-name {
  font-size: 14px;
  margin-right: 10px;
}

.remove-media {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 18px;
}

.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.media-upload {
  display: flex;
  align-items: center;
}

.media-upload input[type="file"] {
  display: none;
}

.media-upload label {
  display: flex;
  align-items: center;
  color: #1877f2;
  cursor: pointer;
  font-size: 14px;
}

.media-icon {
  margin-right: 5px;
  font-size: 18px;
}

.post-button {
  background-color: #1877f2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
}

.post-button:disabled {
  background-color: #e4e6eb;
  color: #bcc0c4;
  cursor: not-allowed;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
}

.error-message button {
  background-color: #c62828;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  margin-top: 10px;
  cursor: pointer;
}

.posts-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.post-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.post-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.post-user-info {
  display: flex;
  align-items: center;
}

.post-user-info div {
  display: flex;
  flex-direction: column;
}

.post-user-info h4 {
  margin: 0;
  font-size: 16px;
}

.post-date {
  font-size: 12px;
  color: #65676b;
}

.post-group {
  font-size: 12px;
  color: #65676b;
}

.post-group a {
  color: #1877f2;
  text-decoration: none;
  cursor: pointer;
}

.delete-button {
  background-color: #f0f2f5;
  color: #65676b;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}

.post-content {
  margin-bottom: 15px;
}

.post-content p {
  margin: 0 0 15px 0;
  font-size: 16px;
  line-height: 1.5;
}

.post-media {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
}

.media-container {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.post-image, .post-video {
  width: 100%;
  max-height: 400px;
  object-fit: cover;
}

.post-stats {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid #e4e6eb;
  border-bottom: 1px solid #e4e6eb;
  margin-bottom: 10px;
  font-size: 14px;
  color: #65676b;
}

.post-actions-bar {
  display: flex;
  justify-content: space-around;
  margin-bottom: 15px;
}

.action-button {
  background: none;
  border: none;
  color: #65676b;
  font-size: 14px;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 0;
}

.action-button.liked {
  color: #1877f2;
}

.like-icon, .comment-icon {
  margin-right: 5px;
  font-size: 18px;
}

.comments-section {
  margin-bottom: 15px;
}

.comment {
  display: flex;
  margin-bottom: 10px;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
}

.comment-content {
  background-color: #f0f2f5;
  border-radius: 18px;
  padding: 8px 12px;
  flex-grow: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.comment-header h5 {
  margin: 0;
  font-size: 14px;
}

.comment-date {
  font-size: 12px;
  color: #65676b;
}

.comment-content p {
  margin: 0;
  font-size: 14px;
}

.comment-form {
  display: flex;
  margin-top: 15px;
}

.comment-input-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.comment-input-container textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 18px;
  resize: none;
  font-size: 14px;
  margin-bottom: 8px;
}

.comment-button {
  align-self: flex-end;
  background-color: #1877f2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
}

.comment-button:disabled {
  background-color: #e4e6eb;
  color: #bcc0c4;
  cursor: not-allowed;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.load-more-button {
  background-color: #f0f2f5;
  color: #1877f2;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #65676b;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #1877f2;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .feed-container {
    padding: 10px;
  }
  
  .post-media {
    grid-template-columns: 1fr;
  }
}
</style>