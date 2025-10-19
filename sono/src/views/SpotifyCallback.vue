<template>
  <div>Logging you in...</div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSpotifyAuth } from '@/composables/useSpotifyAuth'

const { handleRedirect } = useSpotifyAuth()
const router = useRouter()

onMounted(() => {
  handleRedirect()
  router.replace('/')
})
</script>
