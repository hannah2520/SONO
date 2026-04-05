// composables/useMoodRecommendations.js
import { ref } from 'vue'

// Shared state for mood-based recommendations
const moodRecommendations = ref([])
const currentMood = ref('')
const currentGenres = ref([])
const currentSearchTerm = ref('')
const currentSearchQueries = ref([])
const currentArtistSeed = ref([])

export function useMoodRecommendations() {
  const setMoodRecommendations = (tracks, mood, genres, searchTerm, searchQueries, artistSeed) => {
    moodRecommendations.value = tracks || []
    currentMood.value = mood || ''
    currentGenres.value = genres || []
    currentSearchTerm.value = searchTerm || mood || ''
    currentSearchQueries.value = Array.isArray(searchQueries) ? searchQueries.filter(Boolean) : []
    currentArtistSeed.value = Array.isArray(artistSeed) ? artistSeed.filter(Boolean) : []
  }

  const clearMoodRecommendations = () => {
    moodRecommendations.value = []
    currentMood.value = ''
    currentGenres.value = []
    currentSearchTerm.value = ''
    currentSearchQueries.value = []
    currentArtistSeed.value = []
  }

  return {
    moodRecommendations,
    currentMood,
    currentGenres,
    currentSearchTerm,
    currentSearchQueries,
    currentArtistSeed,
    setMoodRecommendations,
    clearMoodRecommendations,
  }
}
