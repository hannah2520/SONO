<!-- This is the first file to load, it contains the router-view which loads the pages. You shouldn't need to edit this page -->
<script setup>
import { RouterView } from 'vue-router'
import SonoNavbar from './components/SonoNavbar.vue';
import SonoFooter from './components/SonoFooter.vue';
</script>

<template>
  <div id="app-root">
    <header>
      <!-- <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" /> -->

      <!-- <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav> -->
      <SonoNavbar />
    </header>

    <main>
      <RouterView />
    </main>

    <SonoFooter />
  </div>
</template>

<style scoped>
/* layout: header, main content, footer */
#app-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

header {
  line-height: 1.5;
}

main {
  flex: 1 0 auto; /* take remaining space so footer stays at bottom */
  padding: 1rem;
}

nav {
  width: 100%;
  font-size: 12px;
  margin-top: 2rem;
}

</style>
