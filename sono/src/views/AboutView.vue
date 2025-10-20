<template>
  <section class="about">
    <div class="about-inner">
      <img src="/logo.svg" alt="Logo" class="logo" />
      <h1>About This Project</h1>
      <p>
        SONO is a music discovery platform that helps you find your next favorite song.
        Instead of hosting music, it curates recommendations based on your listening habits.
        By connecting with Spotify and Last.fm, SONO introduces you to new tracks and artists
        through a simple, personalized experience.
        <br /><br />
        With mood-based discovery, the site's colors and visuals shift with your music,
        blending sound and design for a unique way to explore what's next.
      </p>
    </div>
  </section>
</template>

<style scoped>
.about {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh; /* makes it fill full viewport */
  background: linear-gradient(
    135deg,
    var(--flirty),
    var(--euphoric),
    var(--melancholy)
  );
  color: #fff;
  text-align: center;
  padding: 2rem; /* prevents overflow on small screens */
  box-sizing: border-box;
}

.about-inner {
  width: 50%;
  max-width: 700px;
  backdrop-filter: blur(12px) brightness(1.1);
  background: rgba(255, 255, 255, 0.08);
  padding: 3rem 2rem;
  border-radius: 1.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.logo {
  width: 30%;
  height: auto;
  margin-bottom: 1.5rem;
  animation: float 3s ease-in-out infinite;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

p {
  font-size: 1.05rem;
  line-height: 1.6;
  opacity: 0.9;
}

/* Floating logo animation */
@keyframes float {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
  100% {
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .about-inner {
    width: 90%;
    padding: 2rem 1.5rem;
  }

  .logo {
    width: 50%;
  }
}
</style>
