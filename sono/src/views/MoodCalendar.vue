<template>
  <section class="mood-calendar">
    <h1 class="title">MOOD CALENDAR</h1>
    <h6>
      Track your musical journey, <span>build listening streaks</span>, and visualize your mood
      patterns over time.
    </h6>

    <div class="calendar-header">
      <div class="stat-card new-songs">
        <p class="value">156</p>
        <p class="label">New Songs This Month</p>
      </div>
      <div class="stat-card active-days">
        <p class="value">19</p>
        <p class="label">Active Days</p>
      </div>
      <div class="stat-card achievements">
        <p class="value">3</p>
        <p class="label">New Achievements</p>
      </div>
    </div>

    <div class="calendar-body">
      <h2>October 2025</h2>
      <div class="calendar-grid">
        <div class="weekday" v-for="day in daysOfWeek" :key="day">{{ day }}</div>
        <div class="calendar-cell" v-for="n in 30" :key="n">{{ n }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
</script>

<style scoped>
.mood-calendar {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1 1 auto;
  min-height: 0;
  padding: 3rem 1.5rem 4rem;
  position: relative;
  z-index: 0;
  overflow: hidden;
  text-align: center;
  color: var(--pure);
  background: transparent;
}

/* ===== MAIN CLUSTER LAYER (same blobs, About-style movement) ===== */
.mood-calendar::before {
  content: '';
  position: absolute;
  inset: -18% -15%;
  z-index: -1;
  pointer-events: none;

  background-repeat: no-repeat;
  background-image:
    radial-gradient(520px 520px at 15% 18%, color-mix(in srgb, var(--euphoric) 95%, transparent), transparent 58%),
    radial-gradient(460px 460px at 25% 40%, color-mix(in srgb, var(--flirty) 92%, transparent), transparent 60%),
    radial-gradient(480px 480px at 8% 58%, color-mix(in srgb, var(--melancholy) 92%, transparent), transparent 58%),

    /* 🔵 NEW: bright blue serene-focused blob */
    radial-gradient(540px 540px at 78% 38%, color-mix(in srgb, var(--melancholy) 96%, transparent), transparent 60%),

    radial-gradient(520px 520px at 50% 8%, color-mix(in srgb, var(--serene) 90%, transparent), transparent 60%),
    radial-gradient(460px 460px at 52% 55%, color-mix(in srgb, var(--euphoric) 90%, transparent), transparent 60%),

    radial-gradient(500px 500px at 88% 68%, color-mix(in srgb, var(--hype) 92%, transparent), transparent 60%),
    radial-gradient(420px 420px at 48% 100%, color-mix(in srgb, var(--melancholy) 92%, transparent), transparent 60%);

  filter: blur(16px);
  opacity: 0.98;

  /* match About page motion style */
  animation: calendar-blobs-main 6.5s ease-in-out infinite alternate;
  will-change: transform, opacity;
}

/* ===== ACCENT LAYER (same blobs, About-style accent motion) ===== */
.mood-calendar::after {
  content: '';
  position: absolute;
  inset: -25% -20%;
  z-index: -1;
  pointer-events: none;

  background-repeat: no-repeat;
  background-image:
    radial-gradient(360px 560px at 18% 88%, color-mix(in srgb, var(--melancholy) 85%, transparent), transparent 68%),
    radial-gradient(360px 540px at 82% 78%, color-mix(in srgb, var(--serene) 85%, transparent), transparent 70%),
    radial-gradient(320px 460px at 50% 112%, color-mix(in srgb, var(--euphoric) 85%, transparent), transparent 70%),
    radial-gradient(280px 360px at 35% 45%, color-mix(in srgb, var(--hype) 85%, transparent), transparent 70%);

  filter: blur(22px);
  opacity: 0.88;

  animation: calendar-blobs-accent 4.8s ease-in-out infinite alternate;
  will-change: transform, opacity;
}

/* ===== ANIMATIONS (copied from About, renamed) ===== */
@keyframes calendar-blobs-main {
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

@keyframes calendar-blobs-accent {
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

/* ===== CONTENT STYLING (unchanged) ===== */

.title {
  font-size: 2.4rem;
  font-weight: 800;
  color: var(--confident);
  margin-bottom: 0.65rem;
}

.mood-calendar h6 {
  font-size: 1rem;
  color: black;
  margin-bottom: 2rem;
  max-width: 520px;
}

.mood-calendar h6 span {
  color: var(--euphoric);
  font-weight: 700;
}

.calendar-header {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2.2rem;
  flex-wrap: wrap;
}

.stat-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 14px;
  padding: 1rem;
  width: 160px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.stat-card .value {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
  color: #222;
}

.stat-card .label {
  font-size: 0.9rem;
  color: #555;
}

.new-songs {
  border-top: 4px solid var(--euphoric);
}

.active-days {
  border-top: 4px solid var(--flirty);
}

.achievements {
  border-top: 4px solid var(--melancholy);
}

.calendar-body {
  margin-top: 2rem;
  background: rgba(255, 255, 255, 0.97);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
  max-width: 840px;
  width: 100%;
  align-self: center;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.55rem;
  margin-top: 1rem;
}

.weekday {
  font-weight: 700;
  color: #444;
}

.calendar-cell {
  height: 60px;
  background: #f2f9ff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-weight: 500;
}
</style>



