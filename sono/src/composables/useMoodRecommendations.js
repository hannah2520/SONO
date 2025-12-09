// composables/useMoodRecommendations.js
import { ref } from 'vue'

// Shared state for mood-based recommendations
const moodRecommendations = ref([])
const currentMood = ref('')
const currentGenres = ref([])
const currentSearchTerm = ref('') // 👈 NEW

export function useMoodRecommendations() {
  const setMoodRecommendations = (tracks, mood, genres, searchTerm) => {
    moodRecommendations.value = tracks || []
    currentMood.value = mood || ''
    currentGenres.value = genres || []
    currentSearchTerm.value = searchTerm || mood || ''
  }

  const clearMoodRecommendations = () => {
    moodRecommendations.value = []
    currentMood.value = ''
    currentGenres.value = []
    currentSearchTerm.value = ''
  }

  return {
    moodRecommendations,
    currentMood,
    currentGenres,
    currentSearchTerm,
    setMoodRecommendations,
    clearMoodRecommendations,
  }
}
