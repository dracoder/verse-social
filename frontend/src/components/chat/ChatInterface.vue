<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { subscribeToChannel } from '../../services/echo';

const props = defineProps({
  chatId: {
    type: String,
    default: null
  },
  chatType: {
    type: String,
    default: 'private', // 'private', 'group', 'public'
    validator: (value) => ['private', 'group', 'public'].includes(value)
  },
  recipientId: {
    type: [Number, String],
    default: null
  }
});

const store = useStore();
const route = useRoute();

// State variables
const messages = ref([]);
const newMessage = ref('');
const isLoading = ref(false);
const error = ref(null);
const chatChannel = ref(null);
const isTyping = ref(false);
const typingUsers = ref([]);
const typingTimeout = ref(null);
const messagesContainer = ref(null);

// Computed properties
const currentUser = computed(() => store.getters['auth/currentUser']);
const isDarkMode = computed(() => store.getters.isDarkMode);
const chatTitle = computed(() => {
  if (props.chatType === 'group' && store.getters['groups/currentGroup']) {
    return store.getters['groups/currentGroup'].name;
  } else if (props.chatType === 'private' && recipient.value) {
    return recipient.value.name;
  }
  return 'Chat';
});

// Recipient data for private chats
const recipient = ref(null);

// Load chat history
const loadChatHistory = async () => {
  if (!props.chatId) return;
  
  isLoading.value = true;
  error.value = null;
  
  try {
    // API call would go here
    const response = await fetch(`/api/chats/${props.chatId}/messages`);
    const data = await response.json();
    messages.value = data;
    
    // Scroll to bottom after messages load
    await nextTick();
    scrollToBottom();
  } catch (err) {
    error.value = 'Failed to load chat history. Please try again.';
    console.error('Error loading chat history:', err);
  } finally {
    isLoading.value = false;
  }
};

// Load recipient data for private chats
const loadRecipientData = async () => {
  if (props.chatType !== 'private' || !props.recipientId) return;
  
  try {
    // API call would go here
    const response = await fetch(`/api/users/${props.recipientId}`);
    const data = await response.json();
    recipient.value = data;
  } catch (err) {
    console.error('Error loading recipient data:', err);
  }
};

// Send a message
const sendMessage = async () => {
  if (!newMessage.value.trim()) return;
  
  try {
    // API call would go here
    const messageData = {
      content: newMessage.value,
      chat_id: props.chatId,
      chat_type: props.chatType,
      recipient_id: props.recipientId
    };
    
    // Optimistically add message to UI
    const tempMessage = {
      id: 'temp-' + Date.now(),
      content: newMessage.value,
      user_id: currentUser.value.id,
      user: currentUser.value,
      created_at: new Date().toISOString(),
      status: 'sending'
    };
    
    messages.value.push(tempMessage);
    newMessage.value = '';
    
    // Scroll to bottom
    await nextTick();
    scrollToBottom();
    
    // Send to server
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageData)
    });
    
    const data = await response.json();
    
    // Replace temp message with actual message from server
    const index = messages.value.findIndex(m => m.id === tempMessage.id);
    if (index !== -1) {
      messages.value[index] = data;
    }
  } catch (err) {
    console.error('Error sending message:', err);
    
    // Mark message as failed
    const index = messages.value.findIndex(m => m.id === 'temp-' + Date.now());
    if (index !== -1) {
      messages.value[index].status = 'failed';
    }
  }
};

// Handle typing indicator
const handleTyping = () => {
  if (!newMessage.value.trim()) return;
  
  // Clear previous timeout
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value);
  }
  
  // Emit typing event if not already typing
  if (!isTyping.value) {
    isTyping.value = true;
    emitTypingEvent(true);
  }
  
  // Set timeout to stop typing indicator after 2 seconds of inactivity
  typingTimeout.value = setTimeout(() => {
    isTyping.value = false;
    emitTypingEvent(false);
  }, 2000);
};

// Emit typing event to server
const emitTypingEvent = (isTyping) => {
  if (!chatChannel.value) return;
  
  chatChannel.value.whisper('typing', {
    user: currentUser.value,
    isTyping
  });
};

// Subscribe to chat channel
const subscribeToChatChannel = () => {
  if (!props.chatId || !currentUser.value) return;
  
  let channelName;
  
  if (props.chatType === 'private') {
    channelName = `private-chat.${props.chatId}`;
  } else if (props.chatType === 'group') {
    channelName = `group-chat.${props.chatId}`;
  } else {
    channelName = `public-chat.${props.chatId}`;
  }
  
  chatChannel.value = subscribeToChannel(channelName)
    .listen('.message.created', (data) => {
      // Only add message if it's not from current user
      if (data.message.user_id !== currentUser.value.id) {
        messages.value.push(data.message);
        
        // Scroll to bottom if user is already at bottom
        if (isUserAtBottom()) {
          nextTick(() => scrollToBottom());
        }
      }
    })
    .listenForWhisper('typing', (data) => {
      if (data.user.id === currentUser.value.id) return;
      
      if (data.isTyping) {
        // Add user to typing users if not already there
        if (!typingUsers.value.some(u => u.id === data.user.id)) {
          typingUsers.value.push(data.user);
        }
      } else {
        // Remove user from typing users
        typingUsers.value = typingUsers.value.filter(u => u.id !== data.user.id);
      }
    });
};

// Check if user is scrolled to bottom of messages
const isUserAtBottom = () => {
  if (!messagesContainer.value) return true;
  
  const container = messagesContainer.value;
  const scrollBottom = container.scrollTop + container.clientHeight;
  const threshold = 100; // pixels from bottom
  
  return scrollBottom >= container.scrollHeight - threshold;
};

// Scroll to bottom of messages
const scrollToBottom = () => {
  if (!messagesContainer.value) return;
  
  messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
};

// Format timestamp
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format date for message groups
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
};

// Check if message is from current user
const isOwnMessage = (message) => {
  return message.user_id === currentUser.value?.id;
};

// Retry sending failed message
const retryMessage = async (message) => {
  // Remove failed message
  const index = messages.value.findIndex(m => m.id === message.id);
  if (index !== -1) {
    messages.value.splice(index, 1);
  }
  
  // Set new message content and send again
  newMessage.value = message.content;
  await sendMessage();
};

// Delete message
const deleteMessage = async (messageId) => {
  try {
    await fetch(`/api/messages/${messageId}`, {
      method: 'DELETE'
    });
    
    // Remove message from UI
    messages.value = messages.value.filter(m => m.id !== messageId);
  } catch (err) {
    console.error('Error deleting message:', err);
  }
};

// Watch for changes in chatId
watch(() => props.chatId, () => {
  // Unsubscribe from previous channel
  if (chatChannel.value) {
    chatChannel.value.unsubscribe();
    chatChannel.value = null;
  }
  
  // Reset state
  messages.value = [];
  typingUsers.value = [];
  error.value = null;
  
  // Load new chat data
  loadChatHistory();
  loadRecipientData();
  subscribeToChatChannel();
});

// Lifecycle hooks
onMounted(() => {
  loadChatHistory();
  loadRecipientData();
  subscribeToChatChannel();
});

onUnmounted(() => {
  // Unsubscribe from channel
  if (chatChannel.value) {
    chatChannel.value.unsubscribe();
  }
  
  // Clear typing timeout
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value);
  }
});
</script>

<template>
  <div class="chat-interface" :class="{ 'dark-mode': isDarkMode }">
    <!-- Chat Header -->
    <div class="chat-header">
      <h3>{{ chatTitle }}</h3>
      <div v-if="props.chatType === 'private' && recipient" class="recipient-status">
        <span class="status-indicator" :class="{ 'online': recipient.is_online }"></span>
        <span>{{ recipient.is_online ? 'Online' : 'Offline' }}</span>
      </div>
    </div>
    
    <!-- Chat Messages -->
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="isLoading" class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading messages...</p>
      </div>
      
      <div v-else-if="error" class="error-message">
        {{ error }}
        <button @click="loadChatHistory" class="retry-button">Retry</button>
      </div>
      
      <div v-else-if="messages.length === 0" class="empty-chat">
        <p>No messages yet. Start the conversation!</p>
      </div>
      
      <template v-else>
        <!-- Group messages by date -->
        <div v-for="(group, date) in Object.groupBy(messages, message => formatDate(message.created_at))" :key="date" class="message-group">
          <div class="date-separator">
            <span>{{ date }}</span>
          </div>
          
          <div v-for="message in group" :key="message.id" class="message" :class="{ 'own-message': isOwnMessage(message), 'failed': message.status === 'failed' }">
            <div class="message-avatar" v-if="!isOwnMessage(message)">
              <div class="avatar-placeholder" :style="{ backgroundColor: `hsl(${message.user_id * 30 % 360}, 70%, 60%)` }">
                {{ message.user?.name.charAt(0).toUpperCase() }}
              </div>
            </div>
            
            <div class="message-content">
              <div class="message-header" v-if="!isOwnMessage(message)">
                <span class="message-sender">{{ message.user?.name }}</span>
              </div>
              
              <div class="message-bubble">
                <p>{{ message.content }}</p>
              </div>
              
              <div class="message-footer">
                <span class="message-time">{{ formatTime(message.created_at) }}</span>
                
                <div v-if="message.status === 'sending'" class="message-status sending">
                  <span>Sending...</span>
                </div>
                
                <div v-else-if="message.status === 'failed'" class="message-status failed">
                  <span>Failed to send</span>
                  <button @click="retryMessage(message)" class="retry-button">Retry</button>
                </div>
              </div>
            </div>
            
            <div class="message-actions" v-if="isOwnMessage(message) && message.status !== 'sending'">
              <button @click="deleteMessage(message.id)" class="delete-button" title="Delete message">
                <span>×</span>
              </button>
            </div>
          </div>
        </div>
      </template>
      
      <!-- Typing Indicator -->
      <div v-if="typingUsers.length > 0" class="typing-indicator">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="typing-text">
          {{ typingUsers.length === 1 ? `${typingUsers[0].name} is typing...` : `${typingUsers.length} people are typing...` }}
        </div>
      </div>
    </div>
    
    <!-- Message Input -->
    <div class="chat-input">
      <textarea 
        v-model="newMessage" 
        @keydown.enter.prevent="sendMessage"
        @input="handleTyping"
        placeholder="Type a message..."
        class="message-textarea"
      ></textarea>
      
      <button 
        @click="sendMessage" 
        class="send-button"
        :disabled="!newMessage.trim()"
      >
        Send
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--card-bg);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-color);
}

.chat-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  color: var(--text-color);
}

.recipient-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--text-color-light);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--text-color-light);
}

.status-indicator.online {
  background-color: var(--success-color);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--text-color-light);
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: var(--spacing-sm);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  color: var(--error-color);
  padding: var(--spacing-md);
  background-color: rgba(239, 68, 68, 0.1);
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.retry-button {
  background-color: transparent;
  border: 1px solid currentColor;
  color: inherit;
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  cursor: pointer;
}

.empty-chat {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-color-light);
  font-style: italic;
}

.message-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.date-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: var(--spacing-sm) 0;
  position: relative;
}

.date-separator::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background-color: var(--border-color);
  z-index: 0;
}

.date-separator span {
  background-color: var(--card-bg);
  padding: 0 var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--text-color-light);
  position: relative;
  z-index: 1;
}

.message {
  display: flex;
  gap: var(--spacing-sm);
  max-width: 80%;
}

.message.own-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.message-header {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--text-color);
  margin-left: var(--spacing-xs);
}

.message-bubble {
  background-color: var(--bg-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  position: relative;
}

.own-message .message-bubble {
  background-color: var(--primary-color);
  color: white;
  border: none;
}

.message-bubble p {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-footer {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--text-color-light);
  margin-top: 2px;
  padding: 0 var(--spacing-xs);
}

.own-message .message-footer {
  justify-content: flex-end;
}

.message-time {
  font-size: var(--font-size-xs);
}

.message-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
}

.message-status.sending {
  color: var(--text-color-light);
}

.message-status.failed {
  color: var(--error-color);
}

.message.failed .message-bubble {
  border-color: var(--error-color);
}

.message-actions {
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.message:hover .message-actions {
  opacity: 1;
}

.delete-button {
  background-color: transparent;
  border: none;
  color: var(--text-color-light);
  font-size: var(--font-size-lg);
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s, color 0.2s;
}

.delete-button:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--error-color);
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  color: var(--text-color-light);
  font-size: var(--font-size-xs);
}

.typing-dots {
  display: flex;
  gap: 3px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--text-color-light);
  animation: typing-dot 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) {
  animation-delay: 0s;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-dot {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-4px);
  }
}

.chat-input {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-color);
}

.message-textarea {
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  background-color: var(--bg-color);
  color: var(--text-color);
  font-size: var(--font-size-md);
  font-family: inherit;
  resize: none;
  overflow-y: auto;
}

.send-button {
  align-self: flex-end;
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  height: 40px;
}

.send-button:hover {
  background-color: var(--primary-hover);
}

.send-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Dark mode adjustments */
.dark-mode .chat-header,
.dark-mode .chat-input {
  background-color: var(--dark-card-bg);
  border-color: var(--dark-border-color);
}

.dark-mode .chat-header h3 {
  color: var(--dark-text-color);
}

.dark-mode .message-bubble {
  background-color: var(--dark-card-bg);
  border-color: var(--dark-border-color);
  color: var(--dark-text-color);
}

.dark-mode .date-separator span {
  background-color: var(--dark-card-bg);
}

.dark-mode .date-separator::before {
  background-color: var(--dark-border-color);
}

.dark-mode .message-textarea {
  background-color: var(--dark-card-bg);
  border-color: var(--dark-border-color);
  color: var(--dark-text-color);
}

.dark-mode .spinner {
  border-color: rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary-color);
}

.dark-mode .message-header {
  color: var(--dark-text-color);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .message {
    max-width: 90%;
  }
  
  .message-bubble {
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  
  .chat-input {
    padding: var(--spacing-sm);
  }
}
</style>