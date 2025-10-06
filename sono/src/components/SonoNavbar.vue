<template>
  <header class="topbar">
    <div class="nav-continer">
      <div class="brand">
        <span class="logo" aria-hidden="true">
          <img src="/logo.svg" alt="Sono Logo" />
        </span>
         <RouterLink to="/discover"><img src="/discoverButton.svg" class="discover" alt="discover button"/></RouterLink>
      </div>

      <nav class="nav">
        <RouterLink class="link" to="/">Home</RouterLink>
        <RouterLink class="link" to="/about">About</RouterLink>
        <RouterLink class="link" to="/contact">Contact</RouterLink>
      </nav>

      <RouterLink class="icon-btn" to="/profile" aria-label="Profile">
        <img src="/User.svg" alt="User Profile" />
      </RouterLink>
    </div>
  </header>
</template>

<script>
export default {
  name: 'SonoNavbar',
}
</script>

<style scoped>

.topbar {
  margin: 1rem;
    border-bottom: 1px solid rgba(0,0,0,0.12);
    align-items: center;
}
.nav-continer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Links */
.nav {
  justify-self: center;
  display: inline-flex;
  align-items: center;
  gap: 22px;
}
a {
  text-decoration: none;
}
.discover:hover {
  transform: translateY(-1px);
}
.link {
  color: #4a5568;
    font-family: 'Arial Nova';
  src: url('./ArialNova.ttf') format('truetype');
}
.link:hover {
  color: #111;
}

/* Profile */


/* Active route styling */
.router-link-active.link {
  color: #111;
  font-weight: 600;
}

/* Mobile */
@media (max-width: 640px) {
  .nav {
    display: none;
  }
}
</style>
