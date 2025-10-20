import { defineStore } from 'pinia'

/**
 * Pinia store for Mood Calendar stats.
 * - Holds counts for new songs, active days and achievements.
 * - Provides a simple `fetchStats` action (mock) and `setStats` to update values.
 */
export const useStatsStore = defineStore('stats', {
  state: () => ({
    newSongs: 0,
    activeDays: 0,
    achievements: 0,
  }),
  actions: {
    setStats(payload) {
      if (!payload) return
      if (typeof payload.newSongs === 'number') this.newSongs = payload.newSongs
      if (typeof payload.activeDays === 'number') this.activeDays = payload.activeDays
      if (typeof payload.achievements === 'number') this.achievements = payload.achievements
    },
    // simple mock fetch — replace with real API call
    async fetchStats() {
      // Example: simulate remote call
      const data = await new Promise((res) => setTimeout(() => res({ newSongs: 156, activeDays: 19, achievements: 3 }), 150))
      this.setStats(data)
      return data
    },
  },
})
