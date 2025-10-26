<template>
  <nav class="navbar">
    <!-- Logo -->
    <div class="logo-section">
      <img src="/logo.svg" alt="SONO Logo" class="logo-icon" />
    </div>

    <!-- Navigation Links -->
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
        <RouterLink to="/add-playlist" :class="{ active: isActive('/add-playlist') }">
          Add Playlist
        </RouterLink>
      </li>
      <li><RouterLink to="/about" :class="{ active: isActive('/about') }">About</RouterLink></li>
    </ul>

    <!-- Actions: Spotify + Profile -->
    <div class="action-section">
      <button v-if="!isAuthenticated" class="spotify-btn" @click="login">
        Connect Spotify
      </button>
      <button v-else class="spotify-btn" @click="logout">
        Logout
      </button>

      <RouterLink to="/profile">
        <img src="/User.svg" class="profile-icon" />
      </RouterLink>
    </div>
  </nav>
</template>

<script setup>
import { useRoute, RouterLink } from 'vue-router'
import { useSpotifyAuth } from '../composables/useSpotifyAuth'

const { isAuthenticated, login, logout } = useSpotifyAuth()
const route = useRoute()

const isActive = (path) => route.path === path
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(90deg, var(--confident) 0%, var(--euphoric) 60%, var(--flirty) 100%);
  color: #fff;
  padding: auto;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo-icon {
  width: 100px;
  height: 100px;
  margin: 0%;
  margin-right: 12px;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35));
}

.nav-links {
  display: flex;
  align-items: center;
  list-style: none;
  gap: 2rem;
}

.nav-links a {
  text-decoration: none;
  color: rgba(255, 255, 255, 0.95);
  font-size: 1rem;
  transition: color 0.2s ease, opacity 0.2s ease;
}

.nav-links a:hover {
  color: #fff;
  opacity: 0.95;
}

.gradient-btn {
  background: linear-gradient(90deg, #ff8ad4, #b45fff);
  color: white;
  padding: 0.5rem 1.2rem;
  border-radius: 24px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  font-weight: 700;
}

.active {
  box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.2);
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
  transition: transform 0.12s ease, opacity 0.12s ease;
}

.spotify-btn:hover {
  transform: translateY(-2px);
  opacity: 0.95;
}

.profile-icon {
  width: 48px;
  height: 48px;
}
</style>
