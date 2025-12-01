<template>
  <div class="chatbot-container">
    <div class="chat-header">
      <h3>SONO AI Assistant</h3>
      <button @click="toggleChat" class="close-btn">×</button>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['message', msg.role === 'user' ? 'user-message' : 'ai-message']"
      >
        <div class="message-content">
          {{ msg.content }}
        </div>
      </div>
      
      <div v-if="isLoading" class="message ai-message">
        <div class="message-content typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
    
    <form @submit.prevent="sendMessage" class="chat-input-form">
      <input
        v-model="userInput"
        type="text"
        placeholder="Ask me anything..."
        :disabled="isLoading"
        class="chat-input"
      />
      <button type="submit" :disabled="isLoading || !userInput.trim()" class="send-btn">
        Send
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const messages = ref([
  {
    role: 'assistant',
    content: 'Hi! I\'m your SONO AI assistant. I can help you with music recommendations, mood tracking, and answer any questions about the app. How can I help you today?'
  }
])
const userInput = ref('')
const isLoading = ref(false)
const messagesContainer = ref(null)

const emit = defineEmits(['close'])

const toggleChat = () => {
  emit('close')
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  const userMessage = userInput.value.trim()
  userInput.value = ''

  // Add user message
  messages.value.push({
    role: 'user',
    content: userMessage
  })

  await scrollToBottom()
  isLoading.value = true

  try {
    // Call backend API
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        conversationHistory: messages.value.slice(1, -1) // Exclude welcome message and current user message
      }),
    })

    const data = await response.json()

    if (data.success) {
      messages.value.push({
        role: 'assistant',
        content: data.message
      })
    } else {
      messages.value.push({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      })
    }
  } catch (error) {
    console.error('Error sending message:', error)
    messages.value.push({
      role: 'assistant',
      content: 'Sorry, I couldn\'t connect to the server. Please make sure the backend is running.'
    })
  } finally {
    isLoading.value = false
    await scrollToBottom()
  }
}
</script>

<style scoped>
.chatbot-container {
  display: flex;
  flex-direction: column;
  height: 600px;
  width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.chat-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.close-btn:hover {
  opacity: 0.8;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #f8f9fa;
}

.message {
  margin-bottom: 1rem;
  display: flex;
}

.user-message {
  justify-content: flex-end;
}

.ai-message {
  justify-content: flex-start;
}

.message-content {
  max-width: 75%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  word-wrap: break-word;
}

.user-message .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.ai-message .message-content {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 1rem;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.chat-input-form {
  display: flex;
  padding: 1rem;
  background: white;
  border-top: 1px solid #e0e0e0;
  gap: 0.5rem;
}

.chat-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  outline: none;
}

.chat-input:focus {
  border-color: #667eea;
}

.chat-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.send-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.2s;
}

.send-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
