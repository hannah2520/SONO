<template>
  <section class="mood-calendar">
    <h1 class="title">MOOD CALENDAR</h1>
    <p class="subtitle">
      Track your musical journey, <span>build listening streaks</span>, and visualize your mood patterns over time.
    </p>

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
const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
</script>

<style scoped>
.mood-calendar {
  /* make view behave as a flex child of App.main so it fills available space */
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0; /* allow parent flex to control height */
  padding: 1rem; /* reduced padding to minimize white space */
  background: linear-gradient(to bottom, #b2f1e7, #d3eaff);
  text-align: center;
  font-family: 'Helvetica Neue', sans-serif;
}

.title {
  font-size: 2.2rem;
  font-weight: bold;
  background: linear-gradient(to right, #2cccd3, #9cbae7);
  /* define standard property and vendor-prefixed version for compatibility */
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #555;
  font-size: 1rem;
  margin-bottom: 2rem;
}

.subtitle span {
  color: #38b6ff;
  font-weight: bold;
}

.calendar-header {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  width: 160px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.stat-card .value {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.stat-card .label {
  font-size: 0.9rem;
  color: #444;
}

.new-songs {
  border-top: 4px solid #00d9ff;
}

.active-days {
  border-top: 4px solid #ffaa00;
}

.achievements {
  border-top: 4px solid #ab73ff;
}

.calendar-body {
  margin-top: 2rem;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  margin-top: 1rem;
}

.weekday {
  font-weight: bold;
  color: #444;
}

.calendar-cell {
  height: 60px;
  background-color: #f2f9ff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
}
</style>
