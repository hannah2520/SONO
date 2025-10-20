<template>
  <div class="spotify-callback view-fill">
    <div class="inner">
      <h2>Signing you in...</h2>
      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSpotifyAuth } from '../composables/useSpotifyAuth'

const router = useRouter()
const { handleRedirectCallback } = useSpotifyAuth()
const error = ref(null)

onMounted(async () => {
  try {
    await handleRedirectCallback()
    // optionally redirect back to the page stored in state or to home
    router.replace({ name: 'musicrecommendation' })
  } catch (e) {
    error.value = e?.message || String(e)
    // stay on this page so the user can see the error, or navigate back after a timeout
    console.error('Spotify callback error:', e)
  }
})
</script>

<style scoped>
.view-fill {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
}

.spotify-callback .inner {
  text-align: center;
}

.error {
  color: #e74c3c;
  margin-top: 0.5rem;
}
</style>
