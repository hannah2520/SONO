<!-- our footer component, what you see on the page -->
<template>
  <footer class="sono-footer">
    <p>&copy; {{ year }} SONO.</p>
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
  padding: 1rem 1.25rem;
  /* softer footer to avoid a harsh dividing line */
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(6px) saturate(120%);
  /* remove the explicit top border that caused a visible line */
  border-top: none;
  /* subtle shadow only if needed; keep it very soft */
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.04);
  /* flush to the edges to avoid seams */
  border-radius: 0;
}
.active {
  box-shadow: 3px 3px 8px rgba(0, 0, 0, 0.2);
}

</style>
