<template>
  <header class="topbar">
    <div class="brand">
      <span class="logo" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M9 3v11.05A3.5 3.5 0 1 1 7 17.5V8h10V3H9zM19 8h-2V5h2v3z"/></svg>
      </span>
      <span class="brand-name">SONO</span>
    </div>

    <nav class="nav">
      <RouterLink class="pill" to="/discover">Discover</RouterLink>
      <RouterLink class="link" to="/">Home</RouterLink>
      <RouterLink class="link" to="/about">About</RouterLink>
      <RouterLink class="link" to="/contact">Contact</RouterLink>
    </nav>

    <RouterLink class="icon-btn" to="/profile" aria-label="Profile">
      <svg viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z"/></svg>
    </RouterLink>
  </header>
</template>

<script>
export default {
  name: 'SonoNavbar'
}
</script>

<style scoped>
.topbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 14px 22px;
  border-bottom: 1px solid rgba(0,0,0,0.12);
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(6px);
}

/* Brand */
.brand { display: inline-flex; align-items: center; gap: 10px; }
.logo {
  width: 28px; height: 28px; display: inline-grid; place-items: center;
  border-radius: 8px;
  background: linear-gradient(135deg, #9ae6ff, #c7b7ff);
  box-shadow: 0 2px 0 rgba(0,0,0,0.15) inset;
}
.logo svg { width: 18px; height: 18px; fill: #5b4bdb; }
.brand-name { font-weight: 800; letter-spacing: .3px; color: #5b4bdb; }

/* Links */
.nav { justify-self: center; display: inline-flex; align-items: center; gap: 22px; }
a { text-decoration: none; }
.pill {
  padding: 8px 16px; border-radius: 999px; font-weight: 600; color: n#fff;
  background: linear-gradient(135deg, #c7b7ff, #ffb3d1);
  box-shadow: 0 2px 0 rgba(0,0,0,0.12);
}
.pill:hover { transform: translateY(-1px); }
.link { color: #4a5568; font-weight: 500; }
.link:hover { color: #111; }

/* Profile */
.icon-btn {
  justify-self: end; width: 36px; height: 36px; display: grid; place-items: center;
  border-radius: 50%; border: 1px solid rgba(0,0,0,0.12); background: #fff;
}
.icon-btn svg { width: 20px; height: 20px; fill: #6b7280; }

/* Active route styling */
.router-link-active.link { color: #111; font-weight: 600; }

/* Mobile */
@media (max-width: 640px) {
  .nav { display: none; }
}
</style>
