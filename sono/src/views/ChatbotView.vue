<template>
  <div class="chatbot-view">
    <!-- Let SonoChatbot handle its own layout + blobs -->
    <SonoChatbot @close="goBack" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import SonoChatbot from '../components/SonoChatbot.vue'

const router = useRouter()

const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.chatbot-view {
  min-height: 100vh;
  width: 100%;
  /* no flex centering, no extra gradient –
     background + centering come from SonoChatbot's .chatbot-page */
  padding: 0;
  background: transparent;
}
</style>
