<template>
  <div class="discover-page">
    <main class="content">
      <!-- Header -->
      <div class="content-header">
        <h1 class="section-title">RECOMMENDED FOR YOU</h1>
        <p v-if="currentMood" class="mood-subtitle">
          Mood: <strong>{{ currentMood }}</strong>
          <span v-if="currentGenres.length"> · Genres: <strong>{{ currentGenres.join(', ') }}</strong></span>
        </p>
      </div>

      <!-- Login prompt if not authenticated -->
      <div v-if="!isAuthenticated" class="login-prompt">
        <button @click="login"><img src='/connectSpotifyButton.svg'/></button>
        <p>Please log in to see recommendations.</p>
      </div>

      <!-- Search bar -->
      <div v-else class="search-bar">
        <input
          type="text"
          v-model="searchTerm"
          placeholder="Search Spotify..."
          @keyup.enter="searchSpotify"
        />
        <button @click="searchSpotify">Search</button>
        <button class="refresh-btn" @click="showNextBatch" :disabled="!tracks.length">
          Refresh
        </button>
      </div>

      <!-- Recommendations Grid -->
      <section v-if="isAuthenticated && recommendations.length" class="grid">
        <article v-for="(item, i) in recommendations" :key="i" class="tile">
          <div class="cover-wrap">
            <img :src="item.image" :alt="`${item.title} cover`" />
          </div>
          <a class="title">{{ item.title }}</a>
          <p class="artist">{{ item.artist }}</p>
          <iframe
            :src="`https://open.spotify.com/embed/track/${item.track_id}`"
            width="100%"
            height="80"
            frameborder="0"
            allow="encrypted-media">
          </iframe>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useSpotifyAuth } from '@/composables/useSpotifyAuth'
import { useMoodRecommendations } from '@/composables/useMoodRecommendations'

const { isAuthenticated, login, getAccessToken, handleRedirectCallback } = useSpotifyAuth()
const { moodRecommendations, currentMood, currentGenres } = useMoodRecommendations()

const searchTerm = ref('')
const tracks = ref([])
const recommendations = ref([])
let batchIndex = 0

onMounted(async () => {
  try {
    await handleRedirectCallback()
  } catch (err) {
    console.error('Spotify callback failed:', err)
  }
  
  // Load mood recommendations if available
  if (moodRecommendations.value.length > 0) {
    tracks.value = moodRecommendations.value.map(track => ({
      title: track.name || track.title,
      artist: track.artists || track.artist,
      image: track.image,
      track_id: track.id || track.track_id
    }))
    batchIndex = 0
    updateRecommendations()
  }
})

// Watch for mood recommendations changes
watch(moodRecommendations, (newTracks) => {
  if (newTracks && newTracks.length > 0) {
    tracks.value = newTracks.map(track => ({
      title: track.name || track.title,
      artist: track.artists || track.artist,
      image: track.image,
      track_id: track.id || track.track_id
    }))
    batchIndex = 0
    updateRecommendations()
  }
})
async function searchSpotify() {
  const token = await getAccessToken()
  if (!token) return
  if (!searchTerm.value) return

  try {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchTerm.value)}&type=track&limit=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await res.json()
    tracks.value = data.tracks.items.map(track => ({
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      image: track.album.images[0]?.url,
      track_id: track.id
    }))
    batchIndex = 0
    updateRecommendations()
  } catch (err) {
    console.error(err)
  }
}

function showNextBatch() {
  if (!tracks.value.length) return
  batchIndex += 3
  if (batchIndex >= tracks.value.length) batchIndex = 0
  updateRecommendations()
}

function updateRecommendations() {
  recommendations.value = tracks.value.slice(batchIndex, batchIndex + 3)
}
</script>

<style scoped>
:root {
  --euphoric:#a18dd6;
  --confident: #8b55f3;
  --flirty: #f584b1;
}

.discover-page {
  min-height: 100vh;
  background: radial-gradient(circle at center, var(--euphoric), var(--confident), var(--flirty));
  padding: 2rem 1.5rem;
}

/* Header */
.content-header {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.6rem;
  font-weight: 800;
  background: linear-gradient(90deg, var(--confident), var(--euphoric), var(--flirty));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.mood-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.mood-subtitle strong {
  color: #fff;
  font-weight: 700;
}

/* Search bar */
.search-bar {
  display: flex;
  gap: 12px;
  margin: 1.5rem 0;
}

.search-bar input {
  flex: 1;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  color: #fff;
}

.search-bar input::placeholder {
  color: rgba(255,255,255,0.6);
}

.search-bar button {
  padding: 0.5rem 1.2rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  color: white;
  background: linear-gradient(90deg, var(--confident), var(--euphoric), var(--flirty));
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.8rem;
}

.tile {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.25s, box-shadow 0.25s;
}

.tile:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 16px 30px rgba(0,0,0,0.35);
}

.cover-wrap {
  width: 100%;
  aspect-ratio: 1/1;
  overflow: hidden;
  border-radius: 1rem;
  margin-bottom: 0.8rem;
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
}

.cover-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.title {
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.4rem;
}

.artist {
  color: #ccc;
  font-size: 0.875rem;
}

.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin: 2rem 0;
}

.login-prompt p {
  color: #ccc;
}
</style>
