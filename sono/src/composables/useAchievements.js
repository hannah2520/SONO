import { ref } from 'vue'

const STORAGE_KEY = 'sono-achievements'

const ACHIEVEMENTS = [
  // ── Aria ──────────────────────────────────────────────
  {
    id: 'aria_first',
    title: 'Hello, Aria',
    description: 'Chat with Aria for the first time',
    icon: '🤖',
    condition: ({ ariaUses }) => ariaUses >= 1,
  },
  {
    id: 'aria_5',
    title: 'Vibe Check',
    description: 'Chat with Aria 5 times',
    icon: '💬',
    condition: ({ ariaUses }) => ariaUses >= 5,
  },
  {
    id: 'aria_10',
    title: 'Mood Master',
    description: 'Chat with Aria 10 times',
    icon: '🧠',
    condition: ({ ariaUses }) => ariaUses >= 10,
  },
  // ── Discover ──────────────────────────────────────────
  {
    id: 'discover_first',
    title: 'Explorer',
    description: 'Search for music on the Discover page',
    icon: '🔍',
    condition: ({ discoverUses }) => discoverUses >= 1,
  },
  {
    id: 'discover_5',
    title: 'Dig Deeper',
    description: 'Search on Discover 5 times',
    icon: '🎸',
    condition: ({ discoverUses }) => discoverUses >= 5,
  },
  {
    id: 'discover_10',
    title: 'Curator',
    description: 'Search on Discover 10 times',
    icon: '🎼',
    condition: ({ discoverUses }) => discoverUses >= 10,
  },
  // ── Saves ─────────────────────────────────────────────
  {
    id: 'first_save',
    title: 'First Beat',
    description: 'Save your first song to Spotify',
    icon: '🎵',
    condition: ({ saves }) => saves >= 1,
  },
  {
    id: 'saves_5',
    title: 'Collector',
    description: 'Save 5 songs to Spotify',
    icon: '🎶',
    condition: ({ saves }) => saves >= 5,
  },
  {
    id: 'saves_10',
    title: 'Music Hoarder',
    description: 'Save 10 songs to Spotify',
    icon: '🎧',
    condition: ({ saves }) => saves >= 10,
  },
  // ── Streaks ───────────────────────────────────────────
  {
    id: 'streak_5',
    title: 'On a Roll',
    description: '5 day listening streak',
    icon: '🔥',
    condition: ({ streak }) => streak >= 5,
  },
  {
    id: 'streak_10',
    title: 'Dedicated',
    description: '10 day listening streak',
    icon: '⚡',
    condition: ({ streak }) => streak >= 10,
  },
  {
    id: 'streak_30',
    title: 'Legendary',
    description: '30 day listening streak',
    icon: '👑',
    condition: ({ streak }) => streak >= 30,
  },
  {
    id: 'streak_200',
    title: 'SONO Legend',
    description: '200 day listening streak',
    icon: '🏆',
    condition: ({ streak }) => streak >= 200,
  },
]

function getCount(key) {
  try { return Number(localStorage.getItem(key) || 0) } catch { return 0 }
}

function incrementCount(key) {
  const next = getCount(key) + 1
  localStorage.setItem(key, String(next))
  return next
}

export function incrementAriaUses() { return incrementCount('sono-aria-uses') }
export function incrementDiscoverUses() { return incrementCount('sono-discover-uses') }
export function getAriaUses() { return getCount('sono-aria-uses') }
export function getDiscoverUses() { return getCount('sono-discover-uses') }

function loadUnlocked() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function saveUnlocked(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

const unlockedIds = ref(loadUnlocked())
const pendingToast = ref(null) // { id, title, description, icon }

export function useAchievements() {
  function check({ saves, streak, ariaUses, discoverUses }) {
    const newlyUnlocked = []

    for (const achievement of ACHIEVEMENTS) {
      if (unlockedIds.value.has(achievement.id)) continue
      if (achievement.condition({ saves, streak, ariaUses, discoverUses })) {
        unlockedIds.value.add(achievement.id)
        newlyUnlocked.push(achievement)
      }
    }

    if (newlyUnlocked.length) {
      saveUnlocked(unlockedIds.value)
      // Show the first newly unlocked one as a toast
      pendingToast.value = newlyUnlocked[0]
    }
  }

  function dismissToast() {
    pendingToast.value = null
  }

  function getAllAchievements() {
    return ACHIEVEMENTS.map((a) => ({
      ...a,
      unlocked: unlockedIds.value.has(a.id),
    }))
  }

  function getUnlockedCount() {
    return unlockedIds.value.size
  }

  return {
    check,
    pendingToast,
    dismissToast,
    getAllAchievements,
    getUnlockedCount,
  }
}
