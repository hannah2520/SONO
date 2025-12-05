<template>
  <section class="about">
    <div class="about-inner">
      <img src="/logo.png" alt="Logo" class="logo" />
      <h1>About This Project</h1>
      <p>
        SONO uses AI to understand your mood and translate it into music. Instead of scrolling
        endlessly, you can search for songs based on how you're feeling and explore recommendations
        that evolve with you. Connect your Spotify to save tracks, build playlists, and discover new
        artists, all through a simple, mood-driven experience. With dynamic visuals that shift with
        your emotions, SONO blends sound, design, and AI to help you find exactly what you're meant
        to hear next.
      </p>
    </div>
  </section>
</template>

<style scoped>
.about {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2.5rem 1.5rem;
  box-sizing: border-box;
  color: var(--pure);
  text-align: center;
  overflow: hidden;
  z-index: 0;
  background: transparent;
}

/* ============================================================
   MAIN BLOB CLUSTER (big, layered, breathing, moving)
   ============================================================ */
.about::before {
  content: '';
  position: absolute;
  inset: -25% -18%;
  pointer-events: none;
  z-index: -3;
  background-repeat: no-repeat;

  background-image:
    radial-gradient(
      580px 580px at 12% 40%,
      color-mix(in srgb, var(--euphoric) 95%, transparent),
      transparent 60%
    ),
    radial-gradient(
      520px 520px at 25% 38%,
      color-mix(in srgb, var(--melancholy) 90%, transparent),
      transparent 60%
    ),
    radial-gradient(
      540px 540px at 10% 68%,
      color-mix(in srgb, var(--flirty) 92%, transparent),
      transparent 55%
    ),
    /* blue blob */
      radial-gradient(
        620px 620px at 78% 40%,
        color-mix(in srgb, var(--serene) 96%, transparent),
        transparent 60%
      ),
    radial-gradient(
      580px 580px at 90% 68%,
      color-mix(in srgb, var(--hype) 90%, transparent),
      transparent 60%
    ),
    radial-gradient(
      480px 520px at 50% 96%,
      color-mix(in srgb, var(--euphoric) 93%, transparent),
      transparent 60%
    ),
    /* extra density */
      radial-gradient(
        420px 420px at 32% 82%,
        color-mix(in srgb, var(--serene) 85%, transparent),
        transparent 70%
      ),
    radial-gradient(
      440px 440px at 68% 34%,
      color-mix(in srgb, var(--euphoric) 85%, transparent),
      transparent 70%
    );

  filter: blur(18px);
  opacity: 0.97;

  animation: about-blobs-main 6.5s ease-in-out infinite alternate;
}

/* ============================================================
   ACCENT LAYER — thinner, faster, more streaky blobs
   ============================================================ */
.about::after {
  content: '';
  position: absolute;
  inset: -30% -20%;
  pointer-events: none;
  z-index: -2;
  background-repeat: no-repeat;

  background-image:
    radial-gradient(
      350px 540px at 18% 92%,
      color-mix(in srgb, var(--melancholy) 80%, transparent),
      transparent 68%
    ),
    radial-gradient(
      370px 560px at 82% 78%,
      color-mix(in srgb, var(--serene) 80%, transparent),
      transparent 70%
    ),
    radial-gradient(
      320px 500px at 50% 108%,
      color-mix(in srgb, var(--euphoric) 80%, transparent),
      transparent 68%
    ),
    radial-gradient(
      280px 380px at 30% 52%,
      color-mix(in srgb, var(--flirty) 80%, transparent),
      transparent 70%
    ),
    radial-gradient(
      260px 360px at 72% 88%,
      color-mix(in srgb, var(--flirty) 80%, transparent),
      transparent 70%
    );

  filter: blur(22px);
  opacity: 0.88;

  animation: about-blobs-accent 4.8s ease-in-out infinite alternate;
}

/* ============================================================
   ANIMATIONS — MOVEMENT + BREATHING (combined)
   ============================================================ */
@keyframes about-blobs-main {
  0% {
    transform: translate3d(-40px, -30px, 0) scale(0.9);
    opacity: 0.92;
  }
  25% {
    transform: translate3d(24px, -8px, 0) scale(1.02);
    opacity: 1;
  }
  50% {
    transform: translate3d(48px, 26px, 0) scale(1.08);
    opacity: 1;
  }
  75% {
    transform: translate3d(-18px, 42px, 0) scale(1.04);
    opacity: 0.97;
  }
  100% {
    transform: translate3d(-42px, 58px, 0) scale(0.96);
    opacity: 0.9;
  }
}

@keyframes about-blobs-accent {
  0% {
    transform: translate3d(45px, 45px, 0) scale(0.9);
    opacity: 0.35;
  }
  20% {
    transform: translate3d(15px, 12px, 0) scale(1.06);
    opacity: 0.8;
  }
  50% {
    transform: translate3d(-35px, -28px, 0) scale(1.14);
    opacity: 0.95;
  }
  80% {
    transform: translate3d(-12px, -50px, 0) scale(1.02);
    opacity: 0.55;
  }
  100% {
    transform: translate3d(28px, -62px, 0) scale(0.94);
    opacity: 0.32;
  }
}

/* ============================================================
   CARD + FLOATING LOGO — styled like homepage hero-card
   ============================================================ */
.about-inner {
  width: 52%;
  max-width: 720px;
  padding: 3rem;
  border-radius: 1.5rem;

  /* match homepage hero-card gradient + glass */
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--confident) 60%, transparent),
    color-mix(in srgb, var(--euphoric) 60%, transparent),
    color-mix(in srgb, var(--flirty) 40%, transparent)
  );
  backdrop-filter: blur(14px) saturate(130%);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);

  display: flex;
  flex-direction: column;
  align-items: center;
  animation: cardFloat 6s ease-in-out infinite alternate;
}

.logo {
  width: 32%;
  margin-bottom: 1.5rem;
  animation:
    logoFloat 3s ease-in-out infinite,
    logoPulse 5s ease-in-out infinite alternate;
}

@keyframes cardFloat {
  0% {
    transform: translateY(0) scale(1);
  }
  100% {
    transform: translateY(-5px) scale(1.02);
  }
}

@keyframes logoFloat {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
  100% {
    transform: translateY(0);
  }
}

@keyframes logoPulse {
  0% {
    filter: drop-shadow(0 0 0px rgba(255, 255, 255, 0));
  }
  100% {
    filter: drop-shadow(0 0 16px rgba(255, 255, 255, 0.2));
  }
}

/* text */
h1 {
  font-size: 2.2rem;
  margin-bottom: 1rem;
  font-weight: 800;
  color: var(--pure); /* stays white on the gradient */
}

p {
  font-size: 1.05rem;
  line-height: 1.65;
  opacity: 0.96;
  max-width: 36rem;
}

/* responsive */
/* @media (max-width: 768px) {
  .about-inner {
    width: 90%;
    padding: 2.2rem 1.6rem;
  }
  .logo {
    width: 50%;
  } */
/* } */
</style>
