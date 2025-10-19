<!-- This is the first file to load, it contains the router-view which loads the pages. You shouldn't need to edit this page -->
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
/* Root app layout: make the app a column flex so children can use flex:1 */
#app-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1 1 auto;
  min-height: 0; /* allow children to scroll when necessary */
}
</style>
