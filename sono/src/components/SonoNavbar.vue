<template>
  <header class="topbar">
    <div class="nav-container">
      <div class="brand">
        <RouterLink to="/" aria-label="Sono Home" class="logo-link">
          <img src="/logo.svg" alt="Sono Logo" class="logo" />
        </RouterLink>
        <RouterLink to="/discover" aria-label="Discover">
          <img src="/discoverButton.svg" class="discover" alt="Discover button" />
        </RouterLink>
      </div>

      <nav class="nav">
        <RouterLink class="link" to="/">Home</RouterLink>
        <RouterLink class="link" to="/about">About</RouterLink>
        <RouterLink class="link" to="/contact">Contact</RouterLink>
        <RouterLink class="link" to="/mood-calendar">Mood Calendar</RouterLink>
      </nav>

      <div class="right-actions">
        <RouterLink class="icon-btn" to="/profile" aria-label="Profile">
          <img src="/User.svg" alt="User Profile" class="profile-icon" />
        </RouterLink>

        <button class="spotify-btn" @click="isAuthenticated ? logout() : login()">
          {{ isAuthenticated ? 'Logout' : 'Login with Spotify' }}
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useSpotifyAuth } from '../composables/useSpotifyAuth'

const { isAuthenticated, login, logout } = useSpotifyAuth()
</script>

<style scoped>
.topbar {
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  align-items: center;
  position: relative; /* allow z-index to work */
  z-index: 20; /* keep navbar above page backgrounds */
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* --- Brand Section --- */
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-link {
  display: flex;
  align-items: center;
}

.logo {
  width: 350px;
  height: auto;
  transition: transform 0.2s ease;
}

.logo:hover {
  transform: scale(1.03);
}

.discover {
  width: 150px;
  transition: transform 0.2s ease;
}

.discover:hover {
  transform: translateY(-1px);
}

/* --- Nav Links --- */
.nav {
  display: flex;
  align-items: center;
  gap: 22px;
}

.link {
  color: #4a5568;
  font-family: 'Arial Nova', sans-serif;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s ease;
}

.link:hover {
  color: #111;
}

.router-link-active.link {
  color: #111;
  font-weight: 600;
}

/* --- Profile Icon --- */
.icon-btn {
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;
}

.icon-btn:hover {
  transform: translateY(-1px);
}

.profile-icon {
  width: 48px;
  height: 48px;
}

/* --- Spotify button --- */
.right-actions {
  display: flex;
  align-items: center;
  gap: 12px;
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

.spotify-btn:hover { transform: translateY(-2px); opacity: 0.95 }

/* --- Mobile --- */
@media (max-width: 640px) {
  .nav {
    display: none;
  }
  .logo {
    width: 70px;
  }
}
</style>
