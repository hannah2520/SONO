<!-- redesigned home page: hero with CTAs, features, and glass card -->

<template>
  <main class="home-page">
    <div class="hero">
      <div class="hero-card">
        <div class="hero-left">
          <h1 class="hero-title">Discover your sound</h1>
          <p class="hero-sub">SONO learns your listening habits and mood to deliver personalized
            music recommendations that evolve with you. Connect to Spotify to get started.</p>

          <div class="hero-cta">
            <button v-if="!isAuthenticated" class="spotify-btn" @click="login">Connect Spotify</button>
            <RouterLink to="/discover" class="gradient-btn">Explore Recommendations</RouterLink>
          </div>

          <div class="hero-stats">
            <div class="stat"><strong>156</strong><span>New songs / month</span></div>
            <div class="stat"><strong>19</strong><span>Active days</span></div>
            <div class="stat"><strong>3</strong><span>Achievements</span></div>
          </div>
        </div>

        <div class="hero-right" aria-hidden="true">
          <!-- decorative tiles to hint at recommendations -->
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
import { useSpotifyAuth } from '@/composables/useSpotifyAuth'

const { isAuthenticated, login } = useSpotifyAuth()
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
}

/* background SVG in pseudo so it doesn't affect layout */
.home-page::before {
  /* replace the SVG with subtle radial color blobs so unexpected blue tones are removed
     while preserving a soft decorative background that matches the theme */
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-repeat: no-repeat;
  background-position: center top;
  /* layered radial gradients using theme colors for a minimal, controlled look */
  background-image:
    radial-gradient(600px 400px at 15% 20%, rgba(161,141,214,0.12), transparent 35%),
    radial-gradient(700px 420px at 85% 75%, rgba(245,132,177,0.08), transparent 30%),
    radial-gradient(1000px 600px at 50% 10%, rgba(139,85,243,0.06), transparent 35%);
  background-size: cover;
  opacity: 0.95;
}

.hero {
  width: 100%;
  max-width: 1100px;
}

.hero-card {
  display: flex;
  gap: 2rem;
  align-items: stretch;
  /* minimal glass: remove the visible border/line and soften shadow */
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
  backdrop-filter: blur(14px) saturate(130%);
  border-radius: 1.5rem;
  padding: 3rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
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
  color: rgba(255,255,255,0.92);
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
  background: rgba(255,255,255,0.04);
  padding: 0.6rem 0.9rem;
  border-radius: 10px;
  text-align: left;
}
.stat strong { display: block; font-size: 1.1rem; }
.stat span { color: rgba(255,255,255,0.8); font-size: 0.85rem; }

.hero-right {
  flex: 0 0 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tiles { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.8rem; align-items: center; }
.tile {
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12), rgba(255,255,255,0.02));
  box-shadow: 0 12px 30px rgba(0,0,0,0.14);
  backdrop-filter: blur(6px);
}
.tile.small { width: 56px; height: 56px; justify-self: center; }
.tile.medium { width: 84px; height: 84px; justify-self: center; }
.tile.large { width: 140px; height: 140px; grid-column: 1 / -1; justify-self: center; }

/* @media (max-width: 900px) {
  .hero-card { flex-direction: column; padding: 1.25rem; }
  .hero-right { order: -1; width: 100%; margin-bottom: 0.75rem; }
  .tiles { grid-template-columns: repeat(3, 1fr); gap: 0.6rem; }
  .tile.large { grid-column: span 3; width: 100px; height: 100px; }
  .hero-title { font-size: 2rem; }
} */

.gradient-btn { /* keep consistent with navbar but ensure contrast on hero */
  background: linear-gradient(90deg, var(--confident), var(--euphoric), var(--flirty));
  color: white;
  padding: 0.6rem 1rem;
  border-radius: 999px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}

.spotify-btn { /* reuse and tweak existing style for hero */
  background: linear-gradient(90deg, #1db954, #1ed760);
  color: white;
  border: none;
  padding: 0.6rem 0.9rem;
  border-radius: 999px;
  font-weight: 700;
}
</style>
