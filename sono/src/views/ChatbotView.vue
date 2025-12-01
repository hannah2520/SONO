<template>
  <div class="chatbot-view">
    <div class="chatbot-wrapper">
      <SonoChatbot @close="goBack" />
    </div>
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
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.chatbot-wrapper {
  width: 100%;
  max-width: 500px;
}
</style>
