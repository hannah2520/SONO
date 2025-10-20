<template>
  <section class="mood-calendar-page">
    <div class="calendar-header">
      <div class="header-text">
        <h1 class="title">MOOD CALENDAR</h1>
        <p class="subtitle">
          Track your musical journey, <span>build listening streaks</span>, and visualize your mood patterns over time.
        </p>
      </div>

      <div class="stat-row">
        <div class="stat-card new-songs">
          <p class="value">{{ newSongs }}</p>
          <p class="label">New Songs This Month</p>
        </div>
        <div class="stat-card active-days">
          <p class="value">{{ activeDays }}</p>
          <p class="label">Active Days</p>
        </div>
        <div class="stat-card achievements">
          <p class="value">{{ achievements }}</p>
          <p class="label">New Achievements</p>
        </div>
      </div>
    </div>

    <div class="calendar-body">
      <h2>September 2025</h2>

      <!-- Grid with day labels and calendar cells -->
      <div class="calendar-grid">
        <div class="day-label">Sun</div>
        <div class="day-label">Mon</div>
        <div class="day-label">Tue</div>
        <div class="day-label">Wed</div>
        <div class="day-label">Thu</div>
        <div class="day-label">Fri</div>
        <div class="day-label">Sat</div>

        <div class="calendar-cell">1</div>
        <div class="calendar-cell">2</div>
        <div class="calendar-cell">3</div>
        <div class="calendar-cell">4</div>
        <div class="calendar-cell">5</div>
        <div class="calendar-cell">6</div>
        <div class="calendar-cell">7</div>
        <div class="calendar-cell">8</div>
        <div class="calendar-cell">9</div>
        <div class="calendar-cell">10</div>
        <div class="calendar-cell">11</div>
        <div class="calendar-cell">12</div>
        <div class="calendar-cell">13</div>
        <div class="calendar-cell">14</div>
        <div class="calendar-cell">15</div>
        <div class="calendar-cell">16</div>
        <div class="calendar-cell">17</div>
        <div class="calendar-cell">18</div>
        <div class="calendar-cell">19</div>
        <div class="calendar-cell">20</div>
        <div class="calendar-cell">21</div>
        <div class="calendar-cell">22</div>
        <div class="calendar-cell">23</div>
        <div class="calendar-cell">24</div>
        <div class="calendar-cell">25</div>
        <div class="calendar-cell">26</div>
        <div class="calendar-cell">27</div>
        <div class="calendar-cell">28</div>
        <div class="calendar-cell">29</div>
        <div class="calendar-cell">30</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useStatsStore } from '../stores/stats'

const statsStore = useStatsStore()
const { newSongs, activeDays, achievements } = storeToRefs(statsStore)

onMounted(async () => {
  // Fetch mock stats from the store — replace with real API call inside the store if needed
  await statsStore.fetchStats()
})
</script>

<style scoped>
.mood-calendar-page {
  /* make the view fill the area provided by the App main container */
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  padding: 0.75rem; /* reduced padding to remove extra white space */
  min-height: 0; /* allow parent flex to control height */
  font-family: 'Helvetica Neue', system-ui, Arial, sans-serif;
}

/* Gradient styling for the whole page (restores previous visual) */
.mood-calendar-page {
  background: linear-gradient(to bottom, #b2f1e7, #d3eaff);
  color: #102027;
}

.mood-calendar-page .title {
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0.25rem 0 0.5rem;
  background: linear-gradient(to right, #2cccd3, #9cbae7);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.mood-calendar-page .subtitle {
  color: #23343a;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.calendar-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.stat-row {
  display: flex;
  gap: 0.6rem;
  justify-content: center;
}

.stat-card {
  background: white;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.05);
}

.calendar-body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto; /* allow calendar to grow and fill space */
  min-height: 0;
}

.calendar-body h2 {
  margin: 0.5rem 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px; /* tighter cells */
  margin-top: 0.5rem;
  align-items: stretch;
  /* allow grid to take remaining vertical space and scroll if needed */
  flex: 1 1 auto;
  min-height: 0;
}

.day-label {
  font-weight: 700;
  text-align: center;
  color: #666;
}

.calendar-cell {
  min-height: 56px;
  background: #fff;
  border-radius: 6px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.035);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

@media (max-width: 640px) {
  .stat-row { flex-direction: column; }
  .calendar-grid { gap: 6px; }
}
</style>
