<template>
  <nav class="navbar">
    <div class="logo-section">
      <img src="/logo.png" alt="SONO Logo" class="logo-icon" />
    </div>

    <!-- Desktop nav links -->
    <ul class="nav-links">
      <li>
        <RouterLink to="/chatbot" class="gradient-btn" :class="{ active: isActive('/chatbot') }">
          Aria
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/discover" :class="{ active: isActive('/discover') }">
          Discover
        </RouterLink>
      </li>
      <li><RouterLink to="/" :class="{ active: isActive('/') }">Home</RouterLink></li>
      <li>
        <RouterLink to="/mood-calendar" :class="{ active: isActive('/mood-calendar') }">
          Mood Calendar
        </RouterLink>
      </li>
      <li><RouterLink to="/about" :class="{ active: isActive('/about') }">About</RouterLink></li>
      <li><RouterLink to="/contact" :class="{ active: isActive('/contact') }">Contact</RouterLink></li>
    </ul>

    <div class="action-section">
      <button
        v-if="!loading && !connected"
        class="spotify-btn"
        @click="connectSpotify"
      >
        Connect Spotify
      </button>

      <div v-else-if="!loading && connected" class="spotify-status">
        <span class="spotify-user">
          {{ profile?.display_name || profile?.email || 'Spotify User' }}
        </span>
        <button class="spotify-btn" @click="logoutSpotify">
          Logout
        </button>
      </div>

      <!-- Profile icon -->
      <RouterLink to="/profile" class="profile-icon-link" :class="{ active: isActive('/profile') }" title="Your Profile">
        <img :src="avatarDataUrl || '/default-avatar.svg'" alt="Profile" class="nav-avatar" />
      </RouterLink>
    </div>

    <!-- Hamburger button (mobile only) -->
    <button
      class="hamburger"
      :class="{ open: menuOpen }"
      @click="menuOpen = !menuOpen"
      aria-label="Toggle menu"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

  </nav>

  <!-- Mobile drawer — teleported to body to escape sticky stacking context -->
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="menuOpen" class="mobile-menu" @click.self="menuOpen = false">
        <ul class="mobile-nav-links">
          <li>
            <RouterLink to="/chatbot" class="gradient-btn" :class="{ active: isActive('/chatbot') }" @click="menuOpen = false">
              Aria
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/discover" :class="{ active: isActive('/discover') }" @click="menuOpen = false">
              Discover
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/" :class="{ active: isActive('/') }" @click="menuOpen = false">Home</RouterLink>
          </li>
          <li>
            <RouterLink to="/mood-calendar" :class="{ active: isActive('/mood-calendar') }" @click="menuOpen = false">
              Mood Calendar
            </RouterLink>
          </li>
          <li>
            <RouterLink to="/about" :class="{ active: isActive('/about') }" @click="menuOpen = false">About</RouterLink>
          </li>
          <li>
            <RouterLink to="/contact" :class="{ active: isActive('/contact') }" @click="menuOpen = false">Contact</RouterLink>
          </li>
          <li>
            <RouterLink to="/profile" :class="{ active: isActive('/profile') }" @click="menuOpen = false">Profile</RouterLink>
          </li>
        </ul>

        <div class="mobile-spotify">
          <button v-if="!loading && !connected" class="spotify-btn" @click="connectSpotify">
            Connect Spotify
          </button>
          <div v-else-if="!loading && connected" class="spotify-status">
            <span class="spotify-user">{{ profile?.display_name || profile?.email || 'Spotify User' }}</span>
            <button class="spotify-btn" @click="logoutSpotify">Logout</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useUserProfile } from '@/composables/useUserProfile'

const route = useRoute()
const isActive = (path) => route.path === path

const API_URL = import.meta.env.VITE_API_URL

const loading = ref(true)
const connected = ref(false)
const profile = ref(null)
const menuOpen = ref(false)
const { avatarDataUrl } = useUserProfile()

// Close drawer and unlock scroll on route change
watch(() => route.path, () => { menuOpen.value = false })

// Lock body scroll when drawer is open
watch(menuOpen, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
})

onUnmounted(() => {
  document.body.style.overflow = ''
})

async function fetchStatus() {
  try {
    const res = await fetch(`${API_URL}/api/auth/status`, {
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Status request failed')
    const data = await res.json()
    connected.value = !!data.connected
    profile.value = data.profile
  } catch (e) {
    console.error('Error fetching Spotify status:', e)
    connected.value = false
    profile.value = null
  } finally {
    loading.value = false
  }
}

function connectSpotify() {
  window.location.href = `${API_URL}/api/auth/login`
}

async function logoutSpotify() {
  try {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch (e) {
    console.error('Error logging out of Spotify:', e)
  } finally {
    connected.value = false
    profile.value = null
  }
}

onMounted(() => {
  fetchStatus()
})
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
  padding: 0.75rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.navbar:hover {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.logo-icon {
  width: 64px;
  height: 64px;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35));
}

/* ── Desktop nav ── */
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
  color: #fff;
  text-shadow: 0 0 10px rgba(255,255,255,0.5);
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
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.12s ease, opacity 0.12s ease, box-shadow 0.2s ease;
  white-space: nowrap;
}

.spotify-btn:hover {
  transform: translateY(-2px);
  opacity: 0.95;
  box-shadow: 0 6px 18px rgba(0,0,0,0.2);
}

.spotify-status {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.spotify-user {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.75);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.profile-icon-link {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  border-radius: 50%;
  transition: transform 0.2s, box-shadow 0.2s;
}

.profile-icon-link:hover,
.profile-icon-link.active {
  transform: scale(1.08);
  box-shadow: 0 0 0 2px rgba(255,255,255,0.5);
  border-radius: 50%;
}

.nav-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255,255,255,0.25);
  background: white;
}

/* ── Hamburger (hidden on desktop) ── */
.hamburger {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 28px;
  height: 20px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 110;
}

.hamburger span {
  display: block;
  width: 100%;
  height: 2px;
  background: rgba(255,255,255,0.9);
  border-radius: 2px;
  transition: transform 0.25s ease, opacity 0.25s ease;
  transform-origin: center;
}

.hamburger.open span:nth-child(1) { transform: translateY(9px) rotate(45deg); }
.hamburger.open span:nth-child(2) { opacity: 0; }
.hamburger.open span:nth-child(3) { transform: translateY(-9px) rotate(-45deg); }

/* ── Mobile drawer ── */
.mobile-menu {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 26, 0.6);
  backdrop-filter: blur(4px);
  z-index: 105;
  display: flex;
  justify-content: flex-end;
}

.mobile-nav-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 75%;
  max-width: 300px;
  height: 100%;
  background: linear-gradient(
    160deg,
    color-mix(in srgb, var(--confident) 90%, rgba(10,10,26,0.95)),
    color-mix(in srgb, var(--euphoric) 75%, rgba(10,10,26,0.95)),
    color-mix(in srgb, var(--flirty) 60%, rgba(10,10,26,0.95))
  );
  backdrop-filter: blur(20px);
  padding: 5rem 1.5rem 1.5rem;
  border-left: 1px solid rgba(255,255,255,0.12);
  overflow-y: auto;
  /* push Spotify section to bottom */
  display: flex;
  flex-direction: column;
}

.mobile-nav-links li {
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

/* Spacer to push spotify to bottom */
.mobile-nav-links li:last-of-type {
  border-bottom: none;
}

.mobile-nav-links a {
  display: block;
  padding: 1rem 0.25rem;
  text-decoration: none;
  color: rgba(255,255,255,0.88);
  font-weight: 500;
  font-size: 1.1rem;
  transition: color 0.2s ease;
}

.mobile-nav-links a:hover,
.mobile-nav-links a.active {
  color: #fff;
  text-shadow: 0 0 10px rgba(255,255,255,0.5);
}

.mobile-nav-links .gradient-btn {
  display: inline-block;
  margin: 0.75rem 0;
  padding: 0.55rem 1.4rem;
}

.mobile-spotify {
  width: 75%;
  max-width: 300px;
  padding: 1.25rem 1.5rem 2rem;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--flirty) 60%, rgba(10,10,26,0.95)),
    rgba(10,10,26,0.98)
  );
  border-left: 1px solid rgba(255,255,255,0.12);
  border-top: 1px solid rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  /* sit at bottom of drawer */
  position: absolute;
  bottom: 0;
  right: 0;
}

.mobile-spotify .spotify-status {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
}

.mobile-spotify .spotify-user {
  max-width: 100%;
  font-size: 0.85rem;
}

.mobile-spotify .spotify-btn {
  width: 100%;
  text-align: center;
  padding: 0.7rem 1rem;
}

/* ── Drawer transition ── */
.drawer-enter-active { transition: opacity 0.25s ease; }
.drawer-leave-active { transition: opacity 0.2s ease; }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }

.drawer-enter-active .mobile-nav-links,
.drawer-enter-active .mobile-spotify {
  animation: slideIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.drawer-leave-active .mobile-nav-links,
.drawer-leave-active .mobile-spotify {
  animation: slideOut 0.2s ease both;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
@keyframes slideOut {
  from { transform: translateX(0); }
  to   { transform: translateX(100%); }
}

/* ── Responsive breakpoints ── */
@media (max-width: 768px) {
  .navbar {
    padding: 0.6rem 1.25rem;
  }

  .nav-links,
  .action-section {
    display: none;
  }

  .hamburger {
    display: flex;
  }

  .logo-icon {
    width: 48px;
    height: 48px;
  }
}
</style>
