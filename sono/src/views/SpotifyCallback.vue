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
    // redirect to the intended page or home after login
    router.replace({ name: 'musicrecommendation' })
  } catch (e) {
    error.value = e?.message || String(e)
    console.error('Spotify callback error:', e)
    // optionally redirect after a delay or keep user here to show error
  }
})
</script>

<style scoped>
.view-fill {
  display: flex;
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
