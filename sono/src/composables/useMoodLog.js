import { ref } from 'vue'

const STORAGE_KEY = 'sono-mood-log'

// Reactive in-memory copy so components update when log changes
const moodLog = ref(loadLog())

function loadLog() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10) // "2026-04-05"
}

function dateKey(year, month, day) {
  const m = String(month + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

// Map free-form AI mood labels to one of the site's CSS mood variables
function moodToColor(mood) {
  const m = String(mood || '').toLowerCase()
  if (/sad|down|low|heavy|melan|griev|cry|hurt|heartbreak/.test(m)) return 'var(--melancholy)'
  if (/happy|joy|euphor|excit|upbeat|elat|cheer|bright|celebr/.test(m)) return 'var(--euphoric)'
  if (/calm|chill|relax|peace|seren|gentle|soft|quiet|still/.test(m)) return 'var(--serene)'
  if (/focus|steady|concentr|study|work|productiv/.test(m)) return 'var(--serene)'
  if (/energy|hype|pump|party|hype|wild|intense|power/.test(m)) return 'var(--hype)'
  if (/confiden|bold|strong|determined|motivat/.test(m)) return 'var(--confident)'
  if (/roman|flirt|love|tender|warm|longing|nostalg/.test(m)) return 'var(--flirty)'
  if (/anxi|stress|overwhe|nervous|restless/.test(m)) return 'var(--melancholy)'
  if (/hope|optimis|inspir/.test(m)) return 'var(--euphoric)'
  return 'var(--euphoric)' // default
}

export function useMoodLog() {
  function logMoodForToday(mood, genres = []) {
    if (!mood) return
    const key = todayKey()
    const log = loadLog()
    log[key] = {
      mood,
      genres: Array.isArray(genres) ? genres : [],
      color: moodToColor(mood),
      loggedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log))
    moodLog.value = { ...log }
  }

  function getEntryForDate(year, month, day) {
    return moodLog.value[dateKey(year, month, day)] || null
  }

  function getActiveDaysInMonth(year, month) {
    return Object.keys(moodLog.value).filter((key) => {
      const [y, m] = key.split('-').map(Number)
      return y === year && m - 1 === month
    }).length
  }

  function getCurrentStreak() {
    const log = moodLog.value
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      if (log[key]) streak++
      else break
    }
    return streak
  }

  function getUniqueMoodsInMonth(year, month) {
    const moods = new Set()
    Object.entries(moodLog.value).forEach(([key, entry]) => {
      const [y, m] = key.split('-').map(Number)
      if (y === year && m - 1 === month && entry.mood) moods.add(entry.mood)
    })
    return moods.size
  }

  return {
    moodLog,
    logMoodForToday,
    getEntryForDate,
    getActiveDaysInMonth,
    getCurrentStreak,
    getUniqueMoodsInMonth,
  }
}
