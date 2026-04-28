<template>
  <div class="chatbot-view">
    <!-- Loading auth state -->
    <div v-if="authLoading" class="auth-gate">
      <div class="gate-card">
        <div class="gate-spinner"></div>
      </div>
    </div>

    <!-- Not connected – show gating screen -->
    <div v-else-if="!connected" class="auth-gate">
      <div class="gate-card">
        <div class="gate-icon">🎵</div>
        <h2>Connect Spotify first</h2>
        <p>Aria needs your Spotify connection to find music that matches your mood.</p>
        <button class="gate-connect-btn" @click="connectSpotify">
          <svg class="spotify-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Connect Spotify
        </button>
        <button class="gate-back-btn" @click="goBack">Go back home</button>
      </div>
    </div>

    <!-- Connected – show chatbot -->
    <SonoChatbot v-else @close="goBack" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SonoChatbot from '../components/SonoChatbot.vue'

const API_URL = import.meta.env.VITE_API_URL
const router = useRouter()

const authLoading = ref(true)
const connected = ref(false)

const goBack = () => router.push('/')

function connectSpotify() {
  window.location.href = `${API_URL}/api/auth/login`
}

onMounted(async () => {
  try {
    const res = await fetch(`${API_URL}/api/auth/status`, { credentials: 'include' })
    const data = await res.json()
    connected.value = !!data.connected
  } catch {
    connected.value = false
  } finally {
    authLoading.value = false
  }
})
</script>

<style scoped>
.chatbot-view {
  min-height: 100vh;
  width: 100%;
  padding: 0;
  background: transparent;
}

.auth-gate {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.auth-gate::before {
  content: '';
  position: absolute;
  inset: -20% -15%;
  pointer-events: none;
  z-index: -1;
  background-image:
    radial-gradient(580px 580px at 10% 30%, color-mix(in srgb, var(--euphoric) 96%, transparent), transparent 60%),
    radial-gradient(520px 520px at 22% 55%, color-mix(in srgb, var(--serene) 92%, transparent), transparent 60%),
    radial-gradient(620px 620px at 82% 26%, color-mix(in srgb, var(--flirty) 96%, transparent), transparent 60%),
    radial-gradient(540px 540px at 50% 104%, color-mix(in srgb, var(--euphoric) 90%, transparent), transparent 62%);
  filter: blur(18px);
  opacity: 0.97;
}

.gate-card {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--confident) 45%, transparent),
    color-mix(in srgb, var(--euphoric) 45%, transparent),
    color-mix(in srgb, var(--flirty) 35%, transparent)
  );
  backdrop-filter: blur(16px) saturate(135%);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  border-radius: 1.7rem;
  padding: 3rem 2.5rem;
  text-align: center;
  max-width: 440px;
  width: 100%;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 1;
}

.gate-icon {
  font-size: 2.8rem;
  line-height: 1;
}

.gate-card h2 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
}

.gate-card p {
  margin: 0;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.95rem;
  line-height: 1.55;
  max-width: 320px;
}

.gate-connect-btn {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: linear-gradient(90deg, #1db954, #1ed760);
  color: white;
  border: none;
  padding: 0.78rem 2rem;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 6px 18px rgba(30, 215, 96, 0.35);
}

.gate-connect-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(30, 215, 96, 0.5);
}

.spotify-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.gate-back-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: color 0.15s ease;
}

.gate-back-btn:hover {
  color: rgba(255, 255, 255, 0.9);
}

.gate-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
