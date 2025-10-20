<script setup>
import { RouterView } from 'vue-router'
import SonoNavbar from './components/SonoNavbar.vue'
import SonoFooter from './components/SonoFooter.vue'
</script>

<template>
  <div id="app-root">
    <SonoNavbar />

    <main class="app-main">
      <router-view />
    </main>

    <SonoFooter />
  </div>
</template>

<style>
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
