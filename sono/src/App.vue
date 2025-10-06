<!-- This is the first file to load, it contains the router-view which loads the pages. You shouldn't need to edit this page -->
<script setup>
import { RouterView } from 'vue-router'
import SonoNavbar from './components/SonoNavbar.vue'
import SonoFooter from './components/SonoFooter.vue'
</script>

<template>
  <SonoNavbar />
  <router-view />
  <SonoFooter />
</template>
