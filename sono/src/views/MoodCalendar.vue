<template>
  <section class="mood-calendar">
    <h1 class="title">MOOD CALENDAR</h1>
    <h6>
      Track your musical journey, <span>build listening streaks</span>, and visualize your mood
      patterns over time.
    </h6>

    <!-- Stats -->
    <div class="calendar-header">
      <div class="stat-card active-days">
        <p class="value">{{ activeDays }}</p>
        <p class="label">Active Days This Month</p>
      </div>
      <div class="stat-card streak">
        <p class="value">{{ streak }}</p>
        <p class="label">Day Streak 🔥</p>
      </div>
      <div class="stat-card moods">
        <p class="value">{{ uniqueMoods }}</p>
        <p class="label">Moods Explored</p>
      </div>
    </div>

    <!-- Calendar -->
    <div class="calendar-body">
      <div class="month-nav">
        <button @click="prevMonth" class="nav-btn">‹</button>
        <h2>{{ monthLabel }}</h2>
        <button @click="nextMonth" class="nav-btn" :disabled="isCurrentMonth">›</button>
      </div>

      <div class="calendar-grid">
        <div class="weekday" v-for="day in daysOfWeek" :key="day">{{ day }}</div>

        <div
          v-for="(cell, i) in calendarCells"
          :key="i"
          :class="['calendar-cell', { empty: !cell, today: isToday(cell), 'has-mood': cell && getEntry(cell) }]"
          :style="cell && getEntry(cell) ? { borderTop: `4px solid ${getEntry(cell).color}` } : {}"
          @click="cell && openDay(cell)"
        >
          <template v-if="cell">
            <span class="day-num">{{ cell }}</span>
            <span v-if="getEntry(cell)" class="mood-label">{{ getEntry(cell).mood }}</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Day detail modal -->
    <div v-if="selectedEntry" class="modal-backdrop" @click.self="selectedEntry = null">
      <div class="modal" :style="{ borderTop: `5px solid ${selectedEntry.color}` }">
        <button class="modal-close" @click="selectedEntry = null">×</button>
        <p class="modal-date">{{ selectedDateLabel }}</p>
        <p class="modal-mood">{{ selectedEntry.mood }}</p>
        <div v-if="selectedEntry.genres && selectedEntry.genres.length" class="modal-genres">
          <span v-for="g in selectedEntry.genres" :key="g" class="genre-chip">{{ g }}</span>
        </div>
        <p class="modal-time">Logged at {{ formatTime(selectedEntry.loggedAt) }}</p>
        <button class="discover-btn" @click="goDiscover(selectedEntry)">
          🎵 Explore this mood →
        </button>
      </div>
    </div>

    <!-- No entries prompt -->
    <p v-if="activeDays === 0" class="empty-hint">
      Chat with SONO to automatically log your mood here each day.
    </p>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMoodLog } from '@/composables/useMoodLog'
import { useMoodRecommendations } from '@/composables/useMoodRecommendations'

const router = useRouter()
const { getEntryForDate, getActiveDaysInMonth, getCurrentStreak, getUniqueMoodsInMonth } = useMoodLog()
const { setMoodRecommendations } = useMoodRecommendations()

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const now = new Date()
const viewYear = ref(now.getFullYear())
const viewMonth = ref(now.getMonth()) // 0-indexed

const selectedEntry = ref(null)
const selectedDay = ref(null)

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const monthLabel = computed(() => `${monthNames[viewMonth.value]} ${viewYear.value}`)

const isCurrentMonth = computed(
  () => viewYear.value === now.getFullYear() && viewMonth.value === now.getMonth(),
)

const activeDays = computed(() => getActiveDaysInMonth(viewYear.value, viewMonth.value))
const streak = computed(() => getCurrentStreak())
const uniqueMoods = computed(() => getUniqueMoodsInMonth(viewYear.value, viewMonth.value))

const calendarCells = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1).getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
})

const selectedDateLabel = computed(() => {
  if (!selectedDay.value) return ''
  return new Date(viewYear.value, viewMonth.value, selectedDay.value)
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
})

function getEntry(day) {
  return getEntryForDate(viewYear.value, viewMonth.value, day)
}

function isToday(day) {
  return (
    day === now.getDate() &&
    viewMonth.value === now.getMonth() &&
    viewYear.value === now.getFullYear()
  )
}

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }
}

function nextMonth() {
  if (isCurrentMonth.value) return
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }
}

function openDay(day) {
  const entry = getEntry(day)
  if (!entry) return
  selectedDay.value = day
  selectedEntry.value = entry
}

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function goDiscover(entry) {
  setMoodRecommendations([], entry.mood, entry.genres || [], entry.mood, [])
  selectedEntry.value = null
  router.push({
    path: '/discover',
    query: { mood: entry.mood, autoSearch: 'true', source: 'calendar' },
  })
}
</script>

<style scoped>
:root {
  --euphoric: #a18dd6;
  --confident: #8b55f3;
  --flirty: #f584b1;
}

.mood-calendar {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 3rem 1.5rem 4rem;
  position: relative;
  z-index: 0;
  overflow: hidden;
  text-align: center;
  color: var(--pure);
  background: transparent;
  box-sizing: border-box;
}

/* ===== BLOB BACKGROUNDS ===== */
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
    radial-gradient(540px 540px at 78% 38%, color-mix(in srgb, var(--melancholy) 96%, transparent), transparent 60%),
    radial-gradient(520px 520px at 50% 8%, color-mix(in srgb, var(--serene) 90%, transparent), transparent 60%),
    radial-gradient(500px 500px at 88% 68%, color-mix(in srgb, var(--hype) 92%, transparent), transparent 60%);
  filter: blur(16px);
  opacity: 0.98;
  animation: calendar-blobs-main 6.5s ease-in-out infinite alternate;
  will-change: transform, opacity;
}

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

@keyframes calendar-blobs-main {
  0%   { transform: translate3d(-40px, -30px, 0) scale(0.9);  opacity: 0.92; }
  25%  { transform: translate3d(24px, -8px, 0)   scale(1.02); opacity: 1;    }
  50%  { transform: translate3d(48px, 26px, 0)   scale(1.08); opacity: 1;    }
  75%  { transform: translate3d(-18px, 42px, 0)  scale(1.04); opacity: 0.97; }
  100% { transform: translate3d(-42px, 58px, 0)  scale(0.96); opacity: 0.9;  }
}

@keyframes calendar-blobs-accent {
  0%   { transform: translate3d(45px, 45px, 0)   scale(0.9);  opacity: 0.35; }
  20%  { transform: translate3d(15px, 12px, 0)   scale(1.06); opacity: 0.8;  }
  50%  { transform: translate3d(-35px, -28px, 0) scale(1.14); opacity: 0.95; }
  80%  { transform: translate3d(-12px, -50px, 0) scale(1.02); opacity: 0.55; }
  100% { transform: translate3d(28px, -62px, 0)  scale(0.94); opacity: 0.32; }
}

/* ===== HEADING ===== */
.title {
  font-size: 2.4rem;
  font-weight: 800;
  color: var(--confident);
  margin-bottom: 0.65rem;
}

.mood-calendar h6 {
  font-size: 1rem;
  color: rgba(255,255,255,0.85);
  margin-bottom: 2rem;
  max-width: 520px;
}

.mood-calendar h6 span {
  color: var(--euphoric);
  font-weight: 700;
}

/* ===== STAT CARDS ===== */
.calendar-header {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2.2rem;
  flex-wrap: wrap;
}

.stat-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  padding: 1rem 1.2rem;
  min-width: 150px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.stat-card .value {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 0.2rem;
  color: #111;
}

.stat-card .label {
  font-size: 0.82rem;
  color: #555;
}

.active-days { border-top: 4px solid var(--euphoric); }
.streak      { border-top: 4px solid var(--flirty); }
.moods       { border-top: 4px solid var(--melancholy); }

/* ===== CALENDAR BODY ===== */
.calendar-body {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 18px;
  padding: 1.75rem 1.5rem 2rem;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  max-width: 860px;
  width: 100%;
}

.month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  margin-bottom: 1.2rem;
}

.month-nav h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111;
  min-width: 200px;
}

.nav-btn {
  background: none;
  border: none;
  font-size: 1.6rem;
  color: #555;
  cursor: pointer;
  line-height: 1;
  padding: 0 0.3rem;
  transition: color 0.15s;
}

.nav-btn:hover:not(:disabled) { color: #111; }
.nav-btn:disabled { opacity: 0.3; cursor: default; }

/* ===== GRID ===== */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.45rem;
}

.weekday {
  font-weight: 700;
  color: #666;
  font-size: 0.8rem;
  padding-bottom: 0.4rem;
}

.calendar-cell {
  min-height: 68px;
  background: #f4f6fb;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 0.4rem 0.3rem;
  color: #333;
  font-weight: 500;
  border-top: 4px solid transparent;
  transition: background 0.15s, transform 0.15s;
  position: relative;
  overflow: hidden;
}

.calendar-cell.empty {
  background: transparent;
}

.calendar-cell.today {
  background: #eef0ff;
  box-shadow: inset 0 0 0 2px rgba(139, 85, 243, 0.35);
}

.calendar-cell.has-mood {
  cursor: pointer;
}

.calendar-cell.has-mood:hover {
  transform: translateY(-2px);
  background: #e8eaff;
}

.day-num {
  font-size: 0.85rem;
  font-weight: 700;
  align-self: flex-start;
  padding-left: 0.1rem;
}

.mood-label {
  font-size: 0.62rem;
  font-weight: 600;
  color: #444;
  margin-top: 0.3rem;
  text-align: center;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* ===== MODAL ===== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.modal {
  background: #fff;
  border-radius: 1.2rem;
  padding: 2rem 1.75rem 1.75rem;
  max-width: 360px;
  width: 100%;
  position: relative;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
  text-align: center;
}

.modal-close {
  position: absolute;
  top: 0.85rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: #888;
  line-height: 1;
}

.modal-date {
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.modal-mood {
  font-size: 1.5rem;
  font-weight: 800;
  color: #111;
  margin-bottom: 0.85rem;
  text-transform: capitalize;
}

.modal-genres {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  justify-content: center;
  margin-bottom: 0.85rem;
}

.genre-chip {
  background: #f0ecff;
  color: #6b3fd4;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.7rem;
}

.modal-time {
  font-size: 0.75rem;
  color: #aaa;
  margin-bottom: 1.2rem;
}

.discover-btn {
  width: 100%;
  padding: 0.7rem 1rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--confident), var(--euphoric));
  color: #fff;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}

.discover-btn:hover { opacity: 0.88; }

/* ===== EMPTY HINT ===== */
.empty-hint {
  margin-top: 1.5rem;
  font-size: 0.9rem;
  color: rgba(255,255,255,0.7);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 600px) {
  .calendar-cell { min-height: 52px; }
  .mood-label { display: none; }
  .month-nav h2 { font-size: 1rem; min-width: 160px; }
}
</style>
