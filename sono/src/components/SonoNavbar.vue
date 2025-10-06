<template>
  <nav class="navbar">
    <div class="logo-section">
  <img src="@/assets/sono_brandmark_white_logo_only.png" alt="SONO Logo" class="logo-icon" />
      <span class="logo-text">SONO</span>
    </div>

    <ul class="nav-links">
  <li><RouterLink to="/discover" class="gradient-btn active">Discover</RouterLink></li>
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
  background-color: #f9f8f6;
  padding: 1rem 2rem;
  border-bottom: 1px solid #ddd;
  font-family: 'Helvetica Neue', sans-serif;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo-icon {
  width: 40px;
  height: 40px;
  margin-right: 10px;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: bold;
  background: linear-gradient(to right, #a18cd1, #fbc2eb);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links {
  display: flex;
  align-items: center;
  list-style: none;
  gap: 2rem;
}

.nav-links a {
  text-decoration: none;
  color: #555;
  font-size: 1rem;
  transition: 0.3s ease;
}

.nav-links a:hover {
  color: #000;
}

.gradient-btn {
  background: linear-gradient(to right, #c471ed, #f64f59);
  color: white;
  padding: 0.6rem 1.4rem;
  border: none;
  border-radius: 30px;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
  font-weight: bold;
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
  padding: 0.6rem 1.4rem;
  border-radius: 30px;
  background: white;
  border: 2px solid transparent;
  background-clip: padding-box;
  border-image: linear-gradient(to right, #ef629f, #ffb88c) 1;
  color: #ec4899;
  font-weight: 600;
  transition: all 0.3s ease;
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
