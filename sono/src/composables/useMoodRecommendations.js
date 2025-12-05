import { ref } from 'vue'

// Shared state for mood-based recommendations
const moodRecommendations = ref([])
const currentMood = ref('')
const currentGenres = ref([])

export function useMoodRecommendations() {
  const setMoodRecommendations = (tracks, mood, genres) => {
    moodRecommendations.value = tracks || []
    currentMood.value = mood || ''
    currentGenres.value = genres || []
  }

  const clearMoodRecommendations = () => {
    moodRecommendations.value = []
    currentMood.value = ''
    currentGenres.value = []
  }

  return {
    moodRecommendations,
    currentMood,
    currentGenres,
    setMoodRecommendations,
    clearMoodRecommendations
  }
}
