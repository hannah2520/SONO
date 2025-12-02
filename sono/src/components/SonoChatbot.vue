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

    <!-- Discover Page Button (dynamic mood) -->
    <div class="discover-cta">
      <button @click="goToDiscoverWithMood" class="discover-btn">
        <span v-if="detectedMood">🎵 Explore {{ detectedMood }} Music →</span>
        <span v-else>🎵 Explore Music Recommendations →</span>
      </button>
    </div>

    <!-- Track recommendations (hidden for now) -->
    <div v-if="tracks.length > 0" class="tracks-container" style="display: none;">
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
const detectedMood = ref('') // Track the detected mood for the button
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
            console.log('🎯 Parsed payload:', payload)
            console.log('🎭 Detected mood:', payload.mood)
            header.value = { mood: payload.mood, genres: payload.genres }
            detectedMood.value = payload.mood || '' // Store detected mood for button
            console.log('✅ detectedMood.value set to:', detectedMood.value)
            tracks.value = payload.tracks || []

            // Save recommendations to shared state for discover page
            if (tracks.value.length > 0) {
              setMoodRecommendations(tracks.value, payload.mood, payload.genres)
            }
          } catch (e) {
            console.error('Failed to parse payload:', e)
          }
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

function goToDiscoverWithMood() {
  if (detectedMood.value) {
    // Navigate to discover page with mood as query parameter
    router.push({ path: '/discover', query: { mood: detectedMood.value } })
  } else {
    router.push('/discover')
  }
}

onMounted(() => {
  checkAuth()
})
</script>

<style scoped>
/* PAGE BACKGROUND – same structure as Discover page */
.chatbot-page {
  min-height: 100vh;
  padding: 2rem 1.5rem;
  display: flex;
  justify-content: center;
}

.content {
  width: 100%;
  display: flex;
  justify-content: center;
}

/* Use same gradient language as Discover page */
.chatbot-page {
  background: radial-gradient(
    circle at center,
    var(--euphoric),
    var(--confident),
    var(--flirty)
  );
}

/* MAIN CARD – big glass tile like a hero card */
.chatbot-container {
  width: 100%;
  max-width: 720px;
  border-radius: 1.8rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  background: rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(18px) saturate(140%);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: #111827;
}

/* ============================================================
   AUTH STRIP + HEADER
   ============================================================ */

.auth-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem 1.5rem;
  font-size: 0.85rem;
  background: rgba(15, 23, 42, 0.85);
  color: #e5e7eb;
}

.auth-status strong {
  font-weight: 700;
}

.auth-btn {
  padding: 0.45rem 1.1rem;
  border: none;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease, opacity 0.12s ease;
}

.auth-btn.connect {
  background: linear-gradient(90deg, #1db954, #1ed760);
  color: #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}
.auth-btn.connect:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
}

.auth-btn.disconnect {
  background: rgba(255, 255, 255, 0.16);
  color: #f9fafb;
}
.auth-btn.disconnect:hover {
  background: rgba(255, 255, 255, 0.25);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1.5rem 0.6rem;
  background: rgba(15, 23, 42, 0.9);
  color: #f9fafb;
}

.chat-header h3 {
  margin: 0;
  font-size: 0.95rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.close-btn {
  background: none;
  border: none;
  color: #f9fafb;
  font-size: 1.4rem;
  cursor: pointer;
  padding: 0;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border-radius: 999px;
  transition: background 0.15s ease, transform 0.12s ease;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.16);
  transform: translateY(-1px);
}

/* ============================================================
   MOOD BUTTON STRIP
   ============================================================ */

.mood-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.7rem 1.5rem 0.8rem;
  background: rgba(15, 23, 42, 0.78);
}

.mood-btn {
  padding: 0.4rem 0.95rem;
  border-radius: 999px;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  color: #111827;
  transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
}
.mood-btn:hover:not(:disabled) {
  background: #ffffff;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.16);
  transform: translateY(-1px);
}
.mood-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mood / genre header */
.info-header {
  padding: 0.55rem 1.5rem 0.6rem;
  background: rgba(15, 23, 42, 0.7);
  font-size: 0.82rem;
  color: #e5e7eb;
}

/* ============================================================
   MESSAGES AREA – light, like Discover tiles
   ============================================================ */

.chat-messages {
  height: 320px;
  overflow-y: auto;
  padding: 1.2rem 1.5rem 1.1rem;
  background: #f8fafc;
}

.message {
  margin-bottom: 0.9rem;
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
  padding: 0.7rem 1rem;
  border-radius: 14px;
  word-wrap: break-word;
  font-size: 0.9rem;
}

.user-message .message-content {
  background: linear-gradient(
    135deg,
    var(--confident),
    var(--euphoric)
  );
  color: #fff;
  border-bottom-right-radius: 4px;
}

.ai-message .message-content {
  background: #ffffff;
  color: #111827;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
}

/* typing dots */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 0.6rem 0.8rem;
}
.typing-indicator span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #9ca3af;
  animation: typing 1.4s infinite;
}
.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}
.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-7px);
  }
}

/* ============================================================
   INPUT BAR
   ============================================================ */

.chat-input-form {
  display: flex;
  padding: 0.85rem 1.5rem 0.95rem;
  background: #ffffff;
  border-top: 1px solid #e5e7eb;
  gap: 0.6rem;
}

.chat-input {
  flex: 1;
  padding: 0.7rem 0.9rem;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  font-size: 0.9rem;
  outline: none;
}
.chat-input:focus {
  border-color: color-mix(in srgb, var(--euphoric) 60%, #6366f1 20%);
  box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.25);
}
.chat-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.send-btn {
  padding: 0.7rem 1.5rem;
  background: linear-gradient(
    135deg,
    var(--confident),
    var(--euphoric),
    var(--flirty)
  );
  color: white;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: opacity 0.15s ease, transform 0.12s ease, box-shadow 0.12s ease;
}
.send-btn:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(148, 87, 235, 0.4);
}
.send-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ============================================================
   DISCOVER CTA
   ============================================================ */

.discover-cta {
  padding: 0.9rem 1.5rem 1.2rem;
  display: flex;
  justify-content: center;
  background: rgba(248, 250, 252, 0.98);
  border-top: 1px solid #e5e7eb;
}

.discover-btn {
  padding: 0.8rem 1.8rem;
  background: linear-gradient(
    135deg,
    var(--confident),
    var(--euphoric),
    var(--flirty)
  );
  color: white;
  border: none;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 8px 20px rgba(148, 87, 235, 0.45);
}
.discover-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgba(148, 87, 235, 0.55);
}

/* ============================================================
   TRACKS SECTION (unchanged, lightly tuned)
   ============================================================ */

.tracks-container {
  padding: 1.2rem 1.5rem 1.4rem;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
}

.tracks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.9rem;
}

.tracks-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.view-more-btn {
  padding: 0.45rem 0.95rem;
  background: linear-gradient(
    135deg,
    var(--confident),
    var(--euphoric)
  );
  color: white;
  border: none;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.view-more-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
}

.tracks-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.85rem;
}

.track-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 12px;
  transition: all 0.15s ease;
}
.track-item:hover {
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.15);
}

.track-image {
  width: 56px;
  height: 56px;
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
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-artists {
  font-size: 0.78rem;
  color: #6b7280;
  margin-top: 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.track-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;
}

.track-audio {
  height: 30px;
}

.track-link {
  padding: 0.45rem 0.85rem;
  background: #000;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 600;
  transition: opacity 0.15s ease;
}
.track-link:hover {
  opacity: 0.8;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */

@media (max-width: 768px) {
  .chatbot-page {
    padding: 1.5rem 1rem;
  }

  .chatbot-container {
    border-radius: 1.4rem;
  }

  .chat-messages {
    height: 280px;
  }

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



