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

<script>
export default {
  name: 'MoodCalendar'
}
</script>

<style scoped>
.mood-calendar-page {
  padding: 1.25rem;
  font-family: 'Helvetica Neue', system-ui, Arial, sans-serif;
}

.calendar-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-row {
  display: flex;
  gap: 1rem;
}

.stat-card {
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
}

.calendar-body h2 {
  margin: 0.75rem 0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-top: 0.75rem;
}

.day-label {
  font-weight: 700;
  text-align: center;
  color: #666;
}

.calendar-cell {
  min-height: 64px;
  background: #fff;
  border-radius: 6px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

@media (max-width: 640px) {
  .stat-row { flex-direction: column; }
  .calendar-grid { gap: 6px; }
}
</style>
