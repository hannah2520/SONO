<template>
  <div class="add-playlist">
    <h2>Add Playlist</h2>
    <form @submit.prevent="onSubmit">
      <label>
        Playlist name
        <input v-model="name" placeholder="My playlist" />
      </label>
      <button type="submit">Create</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const name = ref('')
function onSubmit() {
  // placeholder: integrate with store or API
  alert(`Create playlist: ${name.value}`)
}
</script>

<style scoped>
.add-playlist {
  padding: 1rem;
}

.add-playlist form {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

input {
  padding: 0.3rem 0.5rem;
}
</style>
