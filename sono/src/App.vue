<!-- This is the first file to load, it contains the router-view which loads the pages. You shouldn't need to edit this page -->
<script setup>
import { RouterView } from 'vue-router'
import SonoNavbar from './components/SonoNavbar.vue';
import SonoFooter from './components/SonoFooter.vue';
</script>

<template>
  <header>
    <!-- <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" /> -->

      <!-- <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav> -->
      <SonoNavbar />
        <router-view />
      <SonoFooter />
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

nav {
  width: 100%;
  font-size: 12px;
  margin-top: 2rem;
}

</style>
