<template>
  <div class="chatbot-page">
    <main class="content">
      <section class="chat-card">
        <!-- Auth Status Bar -->
        <div class="auth-bar">
          <div class="auth-status">
            <span v-if="auth.connected">
              Connected as <strong>{{ auth.name || 'Spotify user' }}</strong>
            </span>
            <span v-else>Not connected to Spotify</span>
          </div>
          <button
            v-if="!auth.connected"
            @click="connectSpotify"
            class="auth-btn connect"
          >
            Connect Spotify
          </button>
          <button
            v-else
            @click="disconnectSpotify"
            class="auth-btn disconnect"
          >
            Disconnect
          </button>
        </div>

        <div class="chat-header">
          <h3>SONO AI ASSISTANT</h3>
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

        <!-- Messages -->
        <div class="chat-messages" ref="messagesContainer">
          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="[
              'message',
              msg.role === 'user' ? 'user-message' : 'ai-message'
            ]"
          >
            <div class="message-content">{{ msg.content }}</div>
          </div>

          <div v-if="loading" class="message ai-message">
            <div class="message-content typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>

        <!-- Input -->
        <form @submit.prevent="sendMessage" class="chat-input-form">
          <input
            v-model="userInput"
            type="text"
            placeholder="Keep chatting: 'more upbeat', 'like my top artists but sad', etc."
            :disabled="loading"
            class="chat-input"
          />
          <button
            type="submit"
            :disabled="loading || !userInput.trim()"
            class="send-btn"
          >
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

        <!-- Track recommendations (still hidden for now) -->
        <div
          v-if="tracks.length > 0"
          class="tracks-container"
          style="display: none;"
        >
          <div class="tracks-header">
            <h3 class="tracks-title">Fresh picks</h3>
            <button @click="viewMoreRecommendations" class="view-more-btn">
              View More on Discover Page →
            </button>
          </div>
          <ul class="tracks-list">
            <li
              v-for="track in tracks"
              :key="track.id"
              class="track-item"
            >
              <img
                v-if="track.image"
                :src="track.image"
                :alt="track.name"
                class="track-image"
              />
              <div class="track-info">
                <div class="track-name">{{ track.name }}</div>
                <div class="track-artists">{{ track.artists }}</div>
              </div>
              <div class="track-actions">
                <audio
                  v-if="track.preview_url"
                  controls
                  preload="none"
                  :src="track.preview_url"
                  class="track-audio"
                />
                <a
                  :href="track.url"
                  target="_blank"
                  rel="noreferrer"
                  class="track-link"
                >
                  Open
                </a>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </main>
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
  if (detectedMood.value && tracks.value.length > 0) {
    // Save tracks and mood data to shared state
    setMoodRecommendations(tracks.value, detectedMood.value, header.value.genres)
    // Navigate to discover page with mood as query parameter
    router.push({ path: '/discover', query: { mood: detectedMood.value, autoSearch: 'true' } })
  } else if (detectedMood.value) {
    // Navigate with mood even if no tracks yet
    router.push({ path: '/discover', query: { mood: detectedMood.value, autoSearch: 'true' } })
  } else {
    router.push('/discover')
  }
}

onMounted(() => {
  checkAuth()
})
</script>
<style scoped>
:root {
  --euphoric: #a18dd6;
  --confident: #8b55f3;
  --flirty: #f584b1;
}

/* ============================================================
   PAGE WRAPPER + BLOB BACKGROUND (same language as CONTACT)
   ============================================================ */

.chatbot-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3.5rem 1.5rem 4rem;
  box-sizing: border-box;
  color: var(--pure);
  overflow: hidden;
  background: transparent;
  z-index: 0;
}

.chatbot-page::before {
  content: '';
  position: absolute;
  inset: -24% -18%;
  pointer-events: none;
  z-index: -2;
  background-repeat: no-repeat;

  /* copy of your contact blobs, just re-using mood vars */
  background-image:
    radial-gradient(580px 580px at 10% 30%, color-mix(in srgb, var(--euphoric) 96%, transparent), transparent 60%),
    radial-gradient(520px 520px at 22% 55%, color-mix(in srgb, var(--serene) 92%, transparent), transparent 60%),
    radial-gradient(520px 520px at 12% 80%, color-mix(in srgb, var(--melancholy) 92%, transparent), transparent 60%),
    radial-gradient(620px 620px at 82% 26%, color-mix(in srgb, var(--flirty) 96%, transparent), transparent 60%),
    radial-gradient(560px 560px at 90% 72%, color-mix(in srgb, var(--melancholy) 92%, transparent), transparent 60%),
    radial-gradient(540px 540px at 50% 104%, color-mix(in srgb, var(--euphoric) 90%, transparent), transparent 62%);

  filter: blur(18px);
  opacity: 0.97;

  animation: chatbot-blobs-main 6.5s ease-in-out infinite alternate;
  will-change: transform, opacity;
}

.chatbot-page::after {
  content: '';
  position: absolute;
  inset: -30% -20%;
  pointer-events: none;
  z-index: -1;
  background-repeat: no-repeat;

  background-image:
    radial-gradient(360px 560px at 18% 90%, color-mix(in srgb, var(--melancholy) 82%, transparent), transparent 70%),
    radial-gradient(360px 540px at 82% 80%, color-mix(in srgb, var(--serene) 82%, transparent), transparent 72%),
    radial-gradient(320px 460px at 52% 112%, color-mix(in srgb, var(--euphoric) 82%, transparent), transparent 70%),
    radial-gradient(300px 380px at 38% 40%, color-mix(in srgb, var(--hype) 82%, transparent), transparent 72%),
    radial-gradient(280px 360px at 64% 18%, color-mix(in srgb, var(--euphoric) 82%, transparent), transparent 72%);

  filter: blur(22px);
  opacity: 0.9;

  animation: chatbot-blobs-accent 4.8s ease-in-out infinite alternate;
  will-change: transform, opacity;
}

@keyframes chatbot-blobs-main {
  0% { transform: translate3d(-40px, -30px, 0) scale(0.9); opacity: 0.92; }
  25% { transform: translate3d(24px, -8px, 0) scale(1.02); opacity: 1; }
  50% { transform: translate3d(48px, 26px, 0) scale(1.08); opacity: 1; }
  75% { transform: translate3d(-18px, 42px, 0) scale(1.04); opacity: 0.97; }
  100% { transform: translate3d(-42px, 58px, 0) scale(0.96); opacity: 0.9; }
}

@keyframes chatbot-blobs-accent {
  0% { transform: translate3d(45px, 45px, 0) scale(0.9); opacity: 0.35; }
  20% { transform: translate3d(15px, 12px, 0) scale(1.06); opacity: 0.8; }
  50% { transform: translate3d(-35px, -28px, 0) scale(1.14); opacity: 0.95; }
  80% { transform: translate3d(-12px, -50px, 0) scale(1.02); opacity: 0.55; }
  100% { transform: translate3d(28px, -62px, 0) scale(0.94); opacity: 0.32; }
}

/* center content like your contact hero */
.content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
}

/* ============================================================
   CHAT MODAL – gradient shell like CONTACT card
   ============================================================ */

.chat-card {
  width: 100%;
  border-radius: 1.7rem;
  padding: 0; /* inner sections handle padding */
  margin-top: 0.5rem;

  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--confident) 45%, transparent),
    color-mix(in srgb, var(--euphoric) 45%, transparent),
    color-mix(in srgb, var(--flirty) 35%, transparent)
  );
  backdrop-filter: blur(16px) saturate(135%);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);

  overflow: hidden;
  display: flex;
  flex-direction: column;
  color: #111827;
}

/* ============================================================
   AUTH + HEADER – dark slab like contact form tile
   ============================================================ */

.auth-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem 1.5rem;
  font-size: 0.85rem;
  background: rgba(15, 23, 42, 0.96);
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
  background: rgba(15, 23, 42, 0.98);
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
  background: rgba(15, 23, 42, 0.9);
}

.mood-btn {
  padding: 0.4rem 0.95rem;
  border-radius: 999px;
  border: none;
  background: rgba(255, 255, 255, 0.96);
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

.info-header {
  padding: 0.55rem 1.5rem 0.6rem;
  background: rgba(15, 23, 42, 0.7);
  font-size: 0.82rem;
  color: #e5e7eb;
}

/* ============================================================
   MESSAGES AREA – light like your form inputs
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
  background: linear-gradient(135deg, var(--confident), var(--euphoric));
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
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-7px); }
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
  background: linear-gradient(135deg, var(--confident), var(--euphoric), var(--flirty));
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
   DISCOVER CTA – pill like your other gradient CTAs
   ============================================================ */

.discover-cta {
  padding: 0.9rem 1.5rem 1.2rem;
  display: flex;
  justify-content: center;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
}

.discover-btn {
  padding: 0.8rem 1.8rem;
  background: linear-gradient(135deg, var(--confident), var(--euphoric), var(--flirty));
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

/* your tracks styles from before can stay below this if you want them active */

/* ============================================================
   RESPONSIVE
   ============================================================ */

@media (max-width: 768px) {
  .chatbot-page {
    padding: 2.2rem 1rem 3rem;
  }

  .chat-card {
    border-radius: 1.4rem;
  }

  .chat-messages {
    height: 280px;
  }
}
</style>





