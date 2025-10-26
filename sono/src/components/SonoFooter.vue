<!-- our footer component, what you see on the page -->
<template>
  <footer class="sono-footer">
    <p>&copy; {{ year }} Sono.</p>
    <!-- <RouterLink to="/contact" class="gradient-btn" :class="{ active: isActive('/contact') }">
          Contact Us
        </RouterLink> -->
  </footer>
</template>

<script>
export default {
  name: 'SonoFooter'
  ,
  data() {
    return {
      year: new Date().getFullYear()
    }
  }
}
</script>

<style scoped>
.sono-footer {
  text-align: center;
  padding: 1rem;
  background: #f5f5f5;
  color: #333;
}
.active {
  box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.2);
}

</style>
