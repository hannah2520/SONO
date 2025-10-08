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

      <RouterLink class="icon-btn" to="/profile" aria-label="Profile">
        <img src="/User.svg" alt="User Profile" class="profile-icon" />
      </RouterLink>
    </div>
  </header>
</template>

<script setup>
import { RouterLink } from 'vue-router'
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
