// composables/useMoodRecommendations.js
import { ref } from 'vue'

// Shared state for mood-based recommendations
const moodRecommendations = ref([])
const currentMood = ref('')
const currentGenres = ref([])
const currentSearchTerm = ref('')
const currentSearchQueries = ref([])
const currentArtistSeed = ref([])
const currentValence = ref(null)
const currentEnergy = ref(null)

export function useMoodRecommendations() {
  const setMoodRecommendations = (tracks, mood, genres, searchTerm, searchQueries, artistSeed, valence, energy) => {
    moodRecommendations.value = tracks || []
    currentMood.value = mood || ''
    currentGenres.value = genres || []
    currentSearchTerm.value = searchTerm || mood || ''
    currentSearchQueries.value = Array.isArray(searchQueries) ? searchQueries.filter(Boolean) : []
    currentArtistSeed.value = Array.isArray(artistSeed) ? artistSeed.filter(Boolean) : []
    currentValence.value = typeof valence === 'number' ? valence : null
    currentEnergy.value = typeof energy === 'number' ? energy : null
  }

  const clearMoodRecommendations = () => {
    moodRecommendations.value = []
    currentMood.value = ''
    currentGenres.value = []
    currentSearchTerm.value = ''
    currentSearchQueries.value = []
    currentArtistSeed.value = []
    currentValence.value = null
    currentEnergy.value = null
  }

  return {
    moodRecommendations,
    currentMood,
    currentGenres,
    currentSearchTerm,
    currentSearchQueries,
    currentArtistSeed,
    currentValence,
    currentEnergy,
    setMoodRecommendations,
    clearMoodRecommendations,
  }
}
