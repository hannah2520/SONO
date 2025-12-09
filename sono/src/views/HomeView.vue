<template>
  <main class="home-page">
    <div class="hero">
      <div class="hero-card">
        <div class="hero-left">
          <h1 class="hero-title">Discover your sound</h1>
          <p class="hero-sub">
            SONO learns your listening habits and mood to deliver personalized music recommendations
            that evolve with you. Connect to Spotify to get started.
          </p>

          <div class="hero-cta">
            <button v-if="!loading && !connected" class="spotify-btn" @click="connectSpotify">
              Connect Spotify
            </button>

            <!-- optional: small label when connected -->
            <span v-else-if="connected" class="connected-label">
              Connected to Spotify
            </span>

            <RouterLink to="/discover" class="gradient-btn">
              Explore Recommendations
            </RouterLink>
          </div>


          <div class="hero-stats">
            <div class="stat"><strong>156</strong><span>New songs / month</span></div>
            <div class="stat"><strong>19</strong><span>Active days</span></div>
            <div class="stat"><strong>3</strong><span>Achievements</span></div>
          </div>
        </div>

        <div class="hero-right" aria-hidden="true">
          <div class="tiles">
            <div class="tile small"></div>
            <div class="tile large"></div>
            <div class="tile medium"></div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { ref, onMounted } from 'vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:10000'

const loading = ref(true)
const connected = ref(false)
const profile = ref(null)

async function fetchStatus() {
  try {
    const res = await fetch(`${API_URL}/api/auth/status`, {
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Status request failed')
    const data = await res.json()
    connected.value = !!data.connected
    profile.value = data.profile
  } catch (err) {
    console.error('Error fetching Spotify status on Home:', err)
    connected.value = false
    profile.value = null
  } finally {
    loading.value = false
  }
}

function connectSpotify() {
  window.location.href = `${API_URL}/api/auth/login`
}

onMounted(() => {
  fetchStatus()
})
</script>


<style scoped>
.home-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.25rem;
  box-sizing: border-box;
  color: var(--pure);
  overflow: hidden;
  background: transparent;
  z-index: 0;
}

/* ============================================================
   MAIN LAYER — big, dense, like About/Mood
   ============================================================ */
.home-page::before {
  content: '';
  position: absolute;
  inset: -24% -18%;
  z-index: -2;
  pointer-events: none;
  background-repeat: no-repeat;

  /* left cluster framing hero-left */
  background-image:
    radial-gradient(560px 560px at 8% 28%, color-mix(in srgb, var(--euphoric) 96%, transparent), transparent 60%),
    radial-gradient(520px 520px at 20% 52%, color-mix(in srgb, var(--flirty) 92%, transparent), transparent 60%),
    radial-gradient(520px 520px at 10% 78%, color-mix(in srgb, var(--melancholy) 92%, transparent), transparent 60%),

    /* right and upper-right cluster wrapping hero-right */
    radial-gradient(600px 600px at 80% 24%, color-mix(in srgb, var(--serene) 96%, transparent), transparent 60%),
    radial-gradient(540px 540px at 90% 70%, color-mix(in srgb, var(--melancholy) 92%, transparent), transparent 60%),

    /* subtle bottom glow under hero */
    radial-gradient(520px 520px at 50% 104%, color-mix(in srgb, var(--euphoric) 90%, transparent), transparent 62%);

  filter: blur(18px);
  opacity: 0.97;

  /* similar motion profile to About/Mood */
  animation: home-blobs-main 6.8s ease-in-out infinite alternate;
  will-change: transform, opacity;
}

/* ============================================================
   ACCENT LAYER — streaks, extra motion like Mood/About
   ============================================================ */
.home-page::after {
  content: '';
  position: absolute;
  inset: -28% -20%;
  z-index: -1;
  pointer-events: none;
  background-repeat: no-repeat;

  background-image:
    radial-gradient(360px 560px at 18% 90%, color-mix(in srgb, var(--melancholy) 82%, transparent), transparent 70%),
    radial-gradient(360px 540px at 82% 80%, color-mix(in srgb, var(--serene) 82%, transparent), transparent 72%),
    radial-gradient(320px 460px at 52% 112%, color-mix(in srgb, var(--hype) 82%, transparent), transparent 70%),
    radial-gradient(300px 380px at 38% 40%, color-mix(in srgb, var(--hype) 82%, transparent), transparent 72%),
    radial-gradient(280px 360px at 64% 18%, color-mix(in srgb, var(--euphoric) 82%, transparent), transparent 72%);

  filter: blur(22px);
  opacity: 0.9;

  animation: home-blobs-accent 5.1s ease-in-out infinite alternate;
  will-change: transform, opacity;
}

/* ============================================================
   ANIMATIONS — tuned to feel like About/Mood
   ============================================================ */
@keyframes home-blobs-main {
  0% {
    transform: translate3d(-42px, -28px, 0) scale(0.9);
    opacity: 0.92;
  }

  25% {
    transform: translate3d(20px, -6px, 0) scale(1.03);
    opacity: 1;
  }

  50% {
    transform: translate3d(48px, 26px, 0) scale(1.08);
    opacity: 1;
  }

  75% {
    transform: translate3d(-16px, 40px, 0) scale(1.04);
    opacity: 0.97;
  }

  100% {
    transform: translate3d(-44px, 56px, 0) scale(0.96);
    opacity: 0.9;
  }
}

@keyframes home-blobs-accent {
  0% {
    transform: translate3d(42px, 48px, 0) scale(0.9);
    opacity: 0.32;
  }

  20% {
    transform: translate3d(16px, 14px, 0) scale(1.05);
    opacity: 0.7;
  }

  50% {
    transform: translate3d(-36px, -26px, 0) scale(1.16);
    opacity: 0.98;
  }

  80% {
    transform: translate3d(-12px, -52px, 0) scale(1.03);
    opacity: 0.6;
  }

  100% {
    transform: translate3d(30px, -70px, 0) scale(0.92);
    opacity: 0.35;
  }
}

/* ============================================================
   ORIGINAL HERO STYLES (unchanged)
   ============================================================ */

.hero {
  width: 100%;
  max-width: 1100px;
  position: relative;
  z-index: 1;
  /* keep content above blobs */
}

.hero-card {
  display: flex;
  gap: 2rem;
  align-items: stretch;
  background: linear-gradient(135deg,
      color-mix(in srgb, var(--confident) 60%, transparent),
      color-mix(in srgb, var(--euphoric) 60%, transparent),
      color-mix(in srgb, var(--flirty) 40%, transparent));
  backdrop-filter: blur(14px) saturate(130%);
  border-radius: 1.5rem;
  padding: 3rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.hero-left {
  flex: 1 1 65%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-title {
  font-size: 4rem;
  margin: 0 0 0.5rem 0;
  color: var(--confident);
  font-weight: 800;
  letter-spacing: 0.6px;
}

.hero-sub {
  color: rgba(255, 255, 255, 0.92);
  margin-bottom: 1.25rem;
  line-height: 1.5;
}

.hero-cta {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 1.25rem;
}

.hero-stats {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.stat {
  background: rgba(142, 138, 138, 0.04);
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
  text-align: left;
}

.stat strong {
  display: block;
  font-size: 1.1rem;
}

.stat span {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
}

.hero-right {
  flex: 0 0 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tiles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.8rem;
  align-items: center;
}

.tile {
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%,
      rgba(255, 255, 255, 0.12),
      rgba(255, 255, 255, 0.02));
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.14);
  backdrop-filter: blur(6px);
}

.tile.small {
  width: 56px;
  height: 56px;
  justify-self: center;
}

.tile.medium {
  width: 84px;
  height: 84px;
  justify-self: center;
}

.tile.large {
  width: 140px;
  height: 140px;
  grid-column: 1 / -1;
  justify-self: center;
}

.gradient-btn {
  background: linear-gradient(90deg, var(--confident), var(--euphoric), var(--flirty));
  color: white;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}

.spotify-btn {
  background: linear-gradient(90deg, #1db954, #1ed760);
  color: white;
  border: none;
  padding: 0.6rem 0.9rem;
  border-radius: 999px;
  font-weight: 700;
}
</style>
