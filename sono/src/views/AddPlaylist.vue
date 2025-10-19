<template>
  <div class="view-add-playlist">
    <AddPlaylist />
  </div>
</template>

<script setup>
import AddPlaylist from '../components/AddPlaylist.vue'
</script>

<style scoped>
.view-add-playlist {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  padding: 0.5rem; /* tighter padding to reduce white space */
}
</style>
