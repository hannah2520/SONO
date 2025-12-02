<template>
  <nav class="navbar">
    <div class="logo-section">
      <img src="/logo.svg" alt="SONO Logo" class="logo-icon" />
    </div>

    <ul class="nav-links">
      <li>
        <RouterLink to="/discover" class="gradient-btn" :class="{ active: isActive('/discover') }">
          Discover
        </RouterLink>
      </li>
      <li><RouterLink to="/" :class="{ active: isActive('/') }">Home</RouterLink></li>
      <li>
        <RouterLink to="/mood-calendar" :class="{ active: isActive('/mood-calendar') }">
          Mood Calendar
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/chatbot" :class="{ active: isActive('/chatbot') }">
          AI Chatbot
        </RouterLink>
      </li>
      <li><RouterLink to="/about" :class="{ active: isActive('/about') }">About</RouterLink></li>
      <li><RouterLink to="/contact" :class="{ active: isActive('/contact') }">Contact</RouterLink></li>
    </ul>

    <div class="action-section">
      <button v-if="!isAuthenticated" class="spotify-btn" @click="login">
        Connect Spotify
      </button>
      <button v-else class="spotify-btn" @click="logout">
        Logout
      </button>
    </div>
  </nav>
</template>

<script setup>
import { useRoute, RouterLink } from 'vue-router'
import { useSpotifyAuth } from '@/composables/useSpotifyAuth'

const { isAuthenticated, login, logout } = useSpotifyAuth()
const route = useRoute()
const isActive = (path) => route.path === path
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;

  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--confident) 80%, transparent),
    color-mix(in srgb, var(--euphoric) 80%, transparent),
    color-mix(in srgb, var(--flirty) 80%, transparent)
  );
  backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0 0 16px 16px;

  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.10);

  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 20;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}


.navbar:hover {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.logo-icon {
  width: 80px;
  height: 80px;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35));
}

.nav-links {
  display: flex;
  align-items: center;
  list-style: none;
  gap: 1.8rem;
}

.nav-links a {
  text-decoration: none;
  color: rgba(255,255,255,0.9);
  font-weight: 500;
  font-size: 1rem;
  transition: color 0.2s ease, text-shadow 0.2s ease;
}

.nav-links a:hover {
  color: #fff;
  text-shadow: 0 0 8px rgba(255,255,255,0.4);
}

.gradient-btn {
  background: linear-gradient(90deg, var(--confident), var(--euphoric), var(--flirty));
  color: white;
  padding: 0.5rem 1.2rem;
  border-radius: 24px;
  font-weight: 700;
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.gradient-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.25);
}

.active {
  box-shadow: 0 0 12px rgba(255,255,255,0.4);
}

.action-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.spotify-btn {
  background: linear-gradient(90deg, #1db954, #1ed760);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.12s ease, opacity 0.12s ease, box-shadow 0.2s ease;
}

.spotify-btn:hover {
  transform: translateY(-2px);
  opacity: 0.95;
  box-shadow: 0 6px 18px rgba(0,0,0,0.2);
}
</style>
