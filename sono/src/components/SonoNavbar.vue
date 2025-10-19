<template>
  <nav class="navbar">
    <div class="logo-section">
  <img src="@/assets/sono_brandmark_white_logo_only.png" alt="SONO Logo" class="logo-icon" />
      <span class="logo-text">SONO</span>
    </div>

    <ul class="nav-links">
      <li><RouterLink to="/discover" class="gradient-btn">Discover</RouterLink></li>
      <li><RouterLink to="/">Home</RouterLink></li>
      <li><RouterLink to="/mood-calendar">Mood Calendar</RouterLink></li>
      <li><RouterLink to="/add-playlist">Add Playlist</RouterLink></li>
    </ul>

    <div class="action-section">
      <button class="spotify-btn">Connect Spotify</button>
      <!-- profile image was missing in assets; use a initials fallback -->
      <div class="profile-initials">SD</div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'SonoNavbar',
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* darker gradient so the white brandmark stands out */
  background: linear-gradient(90deg, #2b0b3a 0%, #6a17bf 60%, #ff8ad4 100%);
  color: #fff;
  padding: 1rem 2rem;
  border-bottom: none;
  font-family: 'Helvetica Neue', sans-serif;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo-icon {
  width: 48px;
  height: 48px;
  margin-right: 12px;
  object-fit: contain;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35));
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 800;
  color: rgba(255,255,255,0.95);
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
}

.nav-links {
  display: flex;
  align-items: center;
  list-style: none;
  gap: 2rem;
}

.nav-links a {
  text-decoration: none;
  color: rgba(255,255,255,0.95);
  font-size: 1rem;
  transition: 0.2s ease;
}

.nav-links a:hover {
  color: #fff;
  opacity: 0.95;
}

.gradient-btn {
  background: linear-gradient(90deg,#ff8ad4,#b45fff);
  color: white;
  padding: 0.5rem 1.2rem;
  border: none;
  border-radius: 24px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
  font-weight: 700;
}

.active {
  box-shadow: 3px 3px 8px rgba(0,0,0,0.2);
}

.action-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.spotify-btn {
  padding: 0.5rem 1rem;
  border-radius: 24px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.08);
  color: #fff;
  font-weight: 600;
  transition: all 0.18s ease;
}

.spotify-btn:hover {
  background: #fdfdfd;
}

.profile-icon {
  width: 28px;
  height: 28px;
}

.profile-initials {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(90deg,#c471ed,#f64f59);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
</style>
