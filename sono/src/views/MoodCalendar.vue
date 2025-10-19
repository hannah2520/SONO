<template>
  <div class="view-mood-calendar">
    <MoodCalendar />
  </div>
</template>

<script setup>
import MoodCalendar from '../components/MoodCalendar.vue'
</script>

<style scoped>
.view-mood-calendar {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
}
</style>
