<template>
  <div class="chatbot-container">
    <!-- Auth Status Bar -->
    <div class="auth-bar">
      <div class="auth-status">
        <span v-if="auth.connected">Connected as <strong>{{ auth.name || 'Spotify user' }}</strong></span>
        <span v-else>Not connected to Spotify</span>
      </div>
      <button v-if="!auth.connected" @click="connectSpotify" class="auth-btn connect">
        Connect Spotify
      </button>
      <button v-else @click="disconnectSpotify" class="auth-btn disconnect">
        Disconnect
      </button>
    </div>

    <div class="chat-header">
      <h3>SONO AI Assistant</h3>
      <button @click="toggleChat" class="close-btn">×</button>
    </div>

    <!-- Quick mood buttons -->
    <div class="mood-buttons">
      <button 
        v-for="mood in quickMoods" 
        :key="mood" 
        @click="sendQuickMood(mood)"
        :disabled="loading"
        class="mood-btn"
      >
        {{ mood }}
      </button>
    </div>

    <!-- Mood/Genre header -->
    <div v-if="header.mood" class="info-header">
      Mood: <strong>{{ header.mood }}</strong>
      <span v-if="header.genres && header.genres.length">
        · Genres: <strong>{{ header.genres.join(', ') }}</strong>
      </span>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['message', msg.role === 'user' ? 'user-message' : 'ai-message']"
      >
        <div class="message-content">{{ msg.content }}</div>
      </div>
      
      <div v-if="loading" class="message ai-message">
        <div class="message-content typing-indicator">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
    
    <form @submit.prevent="sendMessage" class="chat-input-form">
      <input
        v-model="userInput"
        type="text"
        placeholder="Keep chatting: 'more upbeat', 'like my top artists but sad', etc."
        :disabled="loading"
        class="chat-input"
      />
      <button type="submit" :disabled="loading || !userInput.trim()" class="send-btn">
        Send
      </button>
    </form>

    <!-- Track recommendations -->
    <div v-if="tracks.length > 0" class="tracks-container">
      <div class="tracks-header">
        <h3 class="tracks-title">Fresh picks</h3>
        <button @click="viewMoreRecommendations" class="view-more-btn">
          View More on Discover Page →
        </button>
      </div>
      <ul class="tracks-list">
        <li v-for="track in tracks" :key="track.id" class="track-item">
          <img v-if="track.image" :src="track.image" :alt="track.name" class="track-image" />
          <div class="track-info">
            <div class="track-name">{{ track.name }}</div>
            <div class="track-artists">{{ track.artists }}</div>
          </div>
          <div class="track-actions">
            <audio v-if="track.preview_url" controls preload="none" :src="track.preview_url" class="track-audio" />
            <a :href="track.url" target="_blank" rel="noreferrer" class="track-link">
              Open
            </a>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMoodRecommendations } from '@/composables/useMoodRecommendations'

const router = useRouter()
const { setMoodRecommendations } = useMoodRecommendations()

const TAIL_BEGIN = '<<<JSON:';
const TAIL_END = '>>>';

const messages = ref([
  {
    role: 'assistant',
    content: 'Tell me how you feel — I\'ll riff genres and songs to match your mood.'
  }
])
const userInput = ref('')
const loading = ref(false)
const tracks = ref([])
const header = ref({ mood: '', genres: [] })
const auth = ref({ connected: false, name: '' })
const messagesContainer = ref(null)
const quickMoods = ['Happy', 'Sad', 'Chill', 'Angry', 'Focus']

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

const checkAuth = async () => {
  try {
    const r = await fetch('http://127.0.0.1:3000/api/auth/status', { credentials: 'include' })
    const j = await r.json()
    auth.value = { connected: !!j.connected, name: j?.profile?.display_name }
  } catch {
    auth.value = { connected: false, name: '' }
  }
}

const connectSpotify = () => {
  window.location.href = 'http://127.0.0.1:3000/api/auth/login'
}

const disconnectSpotify = async () => {
  await fetch('http://127.0.0.1:3000/api/auth/logout', { method: 'POST', credentials: 'include' })
  auth.value = { connected: false, name: '' }
}

const sendQuickMood = (mood) => {
  sendMessage(`I'm feeling ${mood.toLowerCase()}`)
}

const sendMessage = async (textOverride = null) => {
  // Handle event object from form submit
  if (textOverride && typeof textOverride === 'object' && textOverride.preventDefault) {
    textOverride = null
  }
  
  const text = textOverride || userInput.value
  if (!text.trim() || loading.value) return

  const userMessage = text.trim()
  if (!textOverride) {
    userInput.value = ''
  }

  // Add user message
  messages.value.push({
    role: 'user',
    content: userMessage
  })

  await scrollToBottom()
  loading.value = true
  tracks.value = []

  // Prepare streaming assistant message
  const assistantIndex = messages.value.length
  messages.value.push({
    role: 'assistant',
    content: ''
  })

  try {
    const response = await fetch('http://127.0.0.1:3000/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        messages: messages.value.slice(0, -1) // Exclude the empty assistant message
      }),
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      buf += chunk

      // Check for trailing JSON
      const idx = buf.indexOf(TAIL_BEGIN)
      if (idx !== -1) {
        const textPart = buf.slice(0, idx)
        messages.value[assistantIndex].content = textPart

        const closeIdx = buf.indexOf(TAIL_END, idx + TAIL_BEGIN.length)
        if (closeIdx !== -1) {
          const jsonRaw = buf.slice(idx + TAIL_BEGIN.length, closeIdx)
          try {
            const payload = JSON.parse(jsonRaw)
            header.value = { mood: payload.mood, genres: payload.genres }
            tracks.value = payload.tracks || []
            
            // Save recommendations to shared state for discover page
            if (tracks.value.length > 0) {
              setMoodRecommendations(tracks.value, payload.mood, payload.genres)
            }
          } catch {}
          buf = buf.slice(closeIdx + TAIL_END.length)
        }
      } else {
        messages.value[assistantIndex].content = buf
      }

      await scrollToBottom()
    }
  } catch (error) {
    console.error('Error sending message:', error)
    messages.value[assistantIndex].content = `Error: ${error?.message || error}`
  } finally {
    loading.value = false
    await scrollToBottom()
    await checkAuth()
  }
}

const viewMoreRecommendations = () => {
  // Save tracks and mood data to shared state
  setMoodRecommendations(tracks.value, header.value.mood, header.value.genres)
  // Navigate to discover page
  router.push('/discover')
}

onMounted(() => {
  checkAuth()
})
</script>

<style scoped>
.chatbot-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 800px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  margin: 0 auto;
}

.auth-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.auth-status {
  font-size: 0.9rem;
  color: #666;
}

.auth-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-btn.connect {
  background: #1db954;
  color: white;
}

.auth-btn.connect:hover {
  background: #1ed760;
}

.auth-btn.disconnect {
  background: #e0e0e0;
  color: #666;
}

.auth-btn.disconnect:hover {
  background: #d0d0d0;
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

.mood-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, rgba(179, 136, 255, 0.2), rgba(255, 138, 171, 0.2));
}

.mood-btn {
  padding: 0.5rem 1rem;
  border-radius: 24px;
  border: none;
  background: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.mood-btn:hover:not(:disabled) {
  background: white;
  transform: translateY(-1px);
}

.mood-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.info-header {
  padding: 0.75rem 1.5rem;
  background: rgba(179, 136, 255, 0.1);
  font-size: 0.9rem;
  opacity: 0.8;
}

.chat-messages {
  height: 320px;
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
  padding: 1rem 1.5rem;
  background: white;
  border-top: 1px solid #e0e0e0;
  gap: 0.5rem;
}

.chat-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 12px;
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
  border-radius: 12px;
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

.tracks-container {
  padding: 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.tracks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.tracks-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.view-more-btn {
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.view-more-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.tracks-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  transition: all 0.2s;
}

.track-item:hover {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.track-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.track-info {
  flex: 1;
  min-width: 0;
}

.track-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artists {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.track-audio {
  height: 32px;
}

.track-link {
  padding: 0.5rem 1rem;
  background: #000;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  transition: opacity 0.2s;
}

.track-link:hover {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .tracks-list {
    grid-template-columns: 1fr;
  }
  
  .track-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .track-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
