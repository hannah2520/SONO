<script setup>
import { onMounted, onUnmounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import SonoNavbar from './components/SonoNavbar.vue'
import SonoFooter from './components/SonoFooter.vue'
import { useAchievements } from '@/composables/useAchievements'
import { useMoodLog } from '@/composables/useMoodLog'
import { getAriaUses, getDiscoverUses } from '@/composables/useAchievements'

const { check, pendingToast, dismissToast } = useAchievements()
const { getCurrentStreak } = useMoodLog()

function getSaveCount() {
  try {
    return JSON.parse(localStorage.getItem('sono-saved-tracks') || '[]').length
  } catch { return 0 }
}

let toastTimer = null

// Watch for toast appearing AFTER Vue flushes reactivity — then start the timer
watch(pendingToast, (val) => {
  clearTimeout(toastTimer)
  if (val) toastTimer = setTimeout(dismissToast, 5000)
})

function fireCheck() {
  check({
    saves: getSaveCount(),
    streak: getCurrentStreak(),
    ariaUses: getAriaUses(),
    discoverUses: getDiscoverUses(),
  })
}

onMounted(() => {
  // Check on mount for streak-based achievements (e.g. crossed threshold overnight)
  // but NOT for usage-based ones to avoid re-toasting already earned ones
  check({
    saves: getSaveCount(),
    streak: getCurrentStreak(),
    ariaUses: getAriaUses(),
    discoverUses: getDiscoverUses(),
  })
  window.addEventListener('sono-track-saved', fireCheck)
  window.addEventListener('sono-aria-used', fireCheck)
  window.addEventListener('sono-discover-used', fireCheck)
})

onUnmounted(() => {
  window.removeEventListener('sono-track-saved', fireCheck)
  window.removeEventListener('sono-aria-used', fireCheck)
  window.removeEventListener('sono-discover-used', fireCheck)
})
</script>

<template>
  <div id="app-root">
    <SonoNavbar />

    <main class="app-main">
      <router-view />
    </main>

    <SonoFooter />

    <!-- Achievement toast -->
    <Transition name="toast">
      <div v-if="pendingToast" class="achievement-toast" @click="dismissToast">
        <span class="toast-icon">{{ pendingToast.icon }}</span>
        <div class="toast-body">
          <p class="toast-title">Achievement Unlocked!</p>
          <p class="toast-name">{{ pendingToast.title }}</p>
          <p class="toast-desc">{{ pendingToast.description }}</p>
        </div>
        <button class="toast-close" @click.stop="dismissToast">×</button>
      </div>
    </Transition>
  </div>
</template>

<style>
/* ============================================================
   ACHIEVEMENT TOAST
   ============================================================ */
.achievement-toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 1.2rem;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, #8b55f3 55%, rgba(15,23,42,0.9)),
    color-mix(in srgb, #a18dd6 55%, rgba(15,23,42,0.9)),
    color-mix(in srgb, #f584b1 40%, rgba(15,23,42,0.9))
  );
  backdrop-filter: blur(20px) saturate(150%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(139, 85, 243, 0.25);
  cursor: pointer;
  max-width: 320px;
  color: #fff;
}

.toast-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.toast-body {
  flex: 1;
}

.toast-title {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 0.15rem;
}

.toast-name {
  font-size: 1rem;
  font-weight: 800;
  margin: 0 0 0.1rem;
  color: #fff;
}

.toast-desc {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.toast-close {
  background: rgba(255, 255, 255, 0.12);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s;
}

.toast-close:hover { background: rgba(255, 255, 255, 0.22); }

.toast-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.25s ease-in; }
.toast-enter-from  { transform: translateY(80px); opacity: 0; }
.toast-leave-to    { transform: translateY(80px); opacity: 0; }

/* Make the app a column flex container filling the viewport */
#app-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Main content grows to fill remaining space, pushing footer down */
.app-main {
  flex: 1 0 auto;   /* allows content to expand but not shrink below content size */
  display: flex;
  flex-direction: column;
  min-height: 0;    /* allows inner content to scroll if necessary */
}

/* Footer always stays at the bottom after content */
footer {
  flex-shrink: 0;   /* ensures footer never shrinks */
}
</style>
