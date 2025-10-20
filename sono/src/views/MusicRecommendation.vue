<template>
  <div class="discover-page">
    <main class="content">
      <!-- Header -->
      <div class="content-header">
        <h1 class="section-title">RECOMMENDED FOR YOU</h1>
      </div>

      <!-- Login prompt if not authenticated -->
      <div v-if="!isAuthenticated" class="login-prompt">
        <button @click="login" class="gradient-btn">Connect Spotify</button>
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
          <a class="title" href="#" @click.prevent>{{ item.title }}</a>
          <p class="artist">{{ item.artist }}</p>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSpotifyAuth } from '@/composables/useSpotifyAuth'

const { isAuthenticated, login, getAccessToken } = useSpotifyAuth()

const searchTerm = ref('')
const tracks = ref([])
const recommendations = ref([])
let batchIndex = 0

// Search Spotify for tracks
async function searchSpotify() {
  const token = await getAccessToken()
  if (!token) {
    console.warn('No Spotify token available. Please log in.')
    return
  }
  if (!searchTerm.value) return

  try {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchTerm.value)}&type=track&limit=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`Spotify search failed: ${res.status} ${txt}`)
    }
    const data = await res.json()
    tracks.value = data.tracks.items.map(track => ({
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      image: track.album.images[0]?.url || ''
    }))
    batchIndex = 0
    updateRecommendations()
  } catch (err) {
    console.error('Spotify search error:', err)
  }
}

// Show next batch of 3 tracks
function showNextBatch() {
  if (!tracks.value.length) return
  batchIndex += 3
  if (batchIndex >= tracks.value.length) batchIndex = 0
  updateRecommendations()
}

// Update recommendations with current batch
function updateRecommendations() {
  recommendations.value = tracks.value.slice(batchIndex, batchIndex + 3)
}
</script>

<style scoped>
/* Recommendations Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #1e1e1e;
  padding: 1rem;
  border-radius: 1rem;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.tile:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.25);
}

.cover-wrap {
  width: 100%;
  aspect-ratio: 1/1;
  overflow: hidden;
  border-radius: 1rem;
  margin-bottom: 0.8rem;
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
  text-decoration: none;
}

.artist {
  color: #ccc;
  font-size: 0.875rem;
  line-height: 1.2rem;
}

/* Minimal addition for search bar */
.search-bar {
  display: flex;
  gap: 12px;
  margin: 16px 0;
}

.search-bar input {
  flex: 1;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: 1px solid #ccc;
  font-size: 1rem;
}

.search-bar input:focus {
  border-color: #6aaedd;
  box-shadow: 0 0 0 2px rgba(106, 174, 221, 0.3);
}

.search-bar button {
  padding: 0.5rem 1.2rem;
  border-radius: 999px;
  background: linear-gradient(90deg, #ff8ad4, #b45fff);
  color: #fff;
  border: none;
  cursor: pointer;
  font-weight: 700;
}

.search-bar button:hover:not(:disabled) {
  background: linear-gradient(90deg, #b45fff, #ff8ad4);
}

.search-bar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Login prompt */
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
