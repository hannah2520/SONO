<template>
  <div class="discover-page">
    <main class="content">
      <!-- Header -->
      <div class="content-header">
        <h1 class="section-title">RECOMMENDED FOR YOU</h1>
      </div>

      <div v-if="loading" class="status-card" aria-live="polite">
        <div class="spinner" aria-hidden="true"></div>
        <p>Checking your Spotify connection...</p>
      </div>

      <!-- Login prompt if not authenticated -->
      <div v-if="!loading && !connected" class="login-prompt">
        <button @click="connectSpotify">
          <img src="/connectSpotifyButton.svg" />
        </button>
        <p>Please log in to see recommendations.</p>
      </div>

      <!-- Search bar -->
      <div v-else-if="connected" class="search-bar">
        <input
          type="text"
          v-model="searchTerm"
          placeholder="Search Spotify..."
          @keyup.enter="searchSpotify"
          :disabled="searchLoading"
        />
        <button @click="searchSpotify" :disabled="searchLoading">
          {{ searchLoading ? 'Loading...' : 'Search' }}
        </button>
        <!-- <div class="mode-toggle">
          <button
            :class="['mode-btn', { active: rankingMode === 'mood' }]"
            @click="setRankingMode('mood')"
            type="button"
          >
            Mood Focus
          </button>
          <button
            :class="['mode-btn', { active: rankingMode === 'discovery' }]"
            @click="setRankingMode('discovery')"
            type="button"
          >
            Discovery Mix
          </button>
        </div> -->
        <button class="refresh-btn" @click="showNextBatch" :disabled="searchLoading || !tracks.length">
          Refresh
        </button>
      </div>

      <div v-if="connected && searchLoading" class="status-card status-card-search" aria-live="polite">
        <div class="spinner" aria-hidden="true"></div>
        <p>{{ loadingMessage }}</p>
      </div>

      <!-- Recommendations Grid -->
      <section v-if="connected && recommendations.length" class="grid">
        <article v-for="(item, i) in recommendations" :key="i" class="tile">
          <div class="cover-wrap">
            <img :src="item.image" :alt="item.title + ' cover'" />

          </div>
          <a class="title">{{ item.title }}</a>
          <p class="artist">{{ item.artist }}</p>
          <iframe
            :src="`https://open.spotify.com/embed/track/${item.track_id}`"
            width="100%"
            height="80"
            frameborder="0"
            allow="encrypted-media"
          ></iframe>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMoodRecommendations } from '@/composables/useMoodRecommendations'


const { moodRecommendations, currentMood, currentGenres, currentSearchTerm, currentSearchQueries } = useMoodRecommendations()
const route = useRoute()


const API_URL = import.meta.env.VITE_API_URL

const loading = ref(true)
const searchLoading = ref(false)
const loadingMessage = ref('Finding recommendations...')
const connected = ref(false)
const profile = ref(null)

const searchTerm = ref('')
const tracks = ref([])
const recommendations = ref([])
const rankingMode = ref('mood')
const lastAiQueries = ref([])
let batchIndex = 0
function buildTrackKey(track) {
  const title = String(track?.title || track?.name || '')
    .trim()
    .toLowerCase()
  const artist = String(track?.artist || track?.artists || '')
    .trim()
    .toLowerCase()

  if (title && artist) {
    return `${title}::${artist}`
  }

  return track?.track_id || track?.id || ''
}

function normalizeArtistName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\w\s,&/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeTracks(rawTracks) {
  return (rawTracks || [])
    .filter((t) => t)
    .map((track) => ({
      title: track.title || track.name || 'Unknown title',
      artist: track.artist || track.artists || 'Unknown artist',
      image:
        track.image ||
        track.albumArt ||
        (track.album && track.album.images && track.album.images[0] && track.album.images[0].url) ||
        '',
      track_id: track.track_id || track.id || '',
    }))
    .filter((t) => t.track_id) // 🚨 only keep if we have a valid ID
}

function applyTrackResults(rawTracks) {
  const uniqueTracks = []
  const seen = new Set()

  normalizeTracks(rawTracks).forEach((track) => {
    const key = buildTrackKey(track)

    if (!key || seen.has(key)) {
      return
    }

    seen.add(key)
    uniqueTracks.push(track)
  })

  tracks.value = uniqueTracks
  batchIndex = 0
  updateRecommendations()
}

async function fetchStatus() {
  try {
    const res = await fetch(`${API_URL}/api/auth/status`, {
      credentials: 'include',
    })
    if (!res.ok) throw new Error('Status request failed')
    const data = await res.json()
    connected.value = !!data.connected
    profile.value = data.profile
  } catch (err) {
    console.error('Error fetching Spotify status:', err)
    connected.value = false
    profile.value = null
  } finally {
    loading.value = false
  }
}

function connectSpotify() {
  window.location.href = `${API_URL}/api/auth/login`
}

// Map moods to specific music genres/styles
function getMoodGenre(mood) {
  const moodToGenreMap = {
    sad: 'RnB soul',
    happy: 'upbeat melodic pop rock Paramore Lil Uzi Vert energetic',
    energetic: 'EDM electronic dance',
    chill: 'lo-fi ambient chill',
    romantic: 'romantic ballad love songs',
    angry: 'rock metal alternative',
    melancholic: 'indie folk acoustic',
    excited: 'pop dance party',
    calm: 'classical piano ambient',
    nostalgic: 'indie alternative 90s',
    confident: 'hip hop rap',
    dreamy: 'dream pop shoegaze',
    focused: 'instrumental jazz focus',
    party: 'dance pop EDM',
    relaxed: 'acoustic singer-songwriter',
  }

  return moodToGenreMap[mood] || mood
}

async function searchSpotify(options = {}) {
  const { skipMoodMapping = false } = options

  if (!connected.value || searchLoading.value) return
  if (!searchTerm.value) return

  const rawQuery = String(searchTerm.value).trim()
  const lowerSearchTerm = rawQuery.toLowerCase()
  const finalQuery = skipMoodMapping ? rawQuery : getMoodGenre(lowerSearchTerm)

  try {
    searchLoading.value = true
    loadingMessage.value = `Finding tracks for "${rawQuery}"...`
    const res = await fetch(
      `${API_URL}/api/spotify/search?q=${encodeURIComponent(finalQuery)}`,
      {
        credentials: 'include',
      }
    )
    if (!res.ok) throw new Error('Spotify search failed')
    const data = await res.json()
    applyTrackResults(data.tracks)
  } catch (err) {
    console.error('Error searching Spotify:', err)
  } finally {
    searchLoading.value = false
  }
}

// function dedupeAndRankTracks(trackGroups, mode = 'mood') {
//   const scored = new Map()

//   trackGroups.forEach((tracksList, queryIndex) => {
//     const queryWeight =
//       mode === 'mood' ? Math.max(1, 7 - queryIndex) * 120 : Math.max(1, 6 - queryIndex) * 70

//     ;(tracksList || []).forEach((track, trackIndex) => {
//       const rankWeight = Math.max(1, 50 - trackIndex)
//       const diversityBonus = mode === 'discovery' ? queryIndex * 18 : 0
//       const score = queryWeight + rankWeight + diversityBonus
//       const existing = scored.get(track.track_id)

//       if (!existing) {
//         scored.set(track.track_id, { ...track, score, hits: 1 })
//       } else {
//         scored.set(track.track_id, {
//           ...existing,
//           score: existing.score + score,
//           hits: existing.hits + 1,
//         })
//       }
//     })
//   })

//   return Array.from(scored.values())
//     .map((track) => ({
//       ...track,
//       finalScore: track.score + (mode === 'mood' ? track.hits * 24 : track.hits * 10),
//     }))
//     .sort((a, b) => b.finalScore - a.finalScore)
//     .map(({ ...track }) => track) // score, hits, finalScore,
// }

async function searchSpotifyByQueries(queries) {
  if (!queries || queries.length === 0) return []

  const cleanedQueries = [...new Set(queries)].slice(0, 2)
  searchLoading.value = true
  loadingMessage.value = 'Blending recommendations for your mood...'

  try {
    const results = []

    for (const query of cleanedQueries) {
      const response = await fetch(
        `${API_URL}/api/spotify/search?q=${encodeURIComponent(query)}`,
        {
          credentials: 'include',
        }
      )

      if (!response.ok) {
        console.error(`Spotify query failed for "${query}" with status ${response.status}`)
        continue
      }

      const data = await response.json()

      if (data?.tracks) {
        results.push(...data.tracks)
      }
    }

    const unique = new Map()

    results.forEach((track) => {
      const trackKey = track?.id || track?.track_id

      if (!trackKey) {
        return
      }

      if (!unique.has(trackKey)) {
        unique.set(trackKey, track)
      }
    })

    return [...unique.values()]
  } finally {
    searchLoading.value = false
  }
}

function uniqueQueries(values = []) {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)))
}

function buildModeQueries({ mode, mood, genres, searchTermValue, aiQueries }) {
  const moodText = String(mood || '').trim()
  const termText = String(searchTermValue || '').trim()
  const genreList = Array.isArray(genres) ? genres.filter(Boolean) : []
  const aiList = Array.isArray(aiQueries) ? aiQueries.filter(Boolean) : []

  const base = uniqueQueries([termText, moodText, ...aiList])

  if (mode === 'mood') {
    return uniqueQueries([
      ...base,
      moodText && `${moodText} ${genreList.join(' ')}`,
      moodText && `${moodText} emotional ${genreList.join(' ')}`,
      moodText && `moody ${moodText} ${termText}`,
    ]).slice(0, 6)
  }

  return uniqueQueries([
    ...base,
    ...genreList.map((genre) => `${genre} new releases`),
    ...genreList.map((genre) => `${genre} hidden gems`),
    moodText && `${moodText} but different vibe ${genreList.join(' ')}`,
    termText && `${termText} fresh discovery`,
  ]).slice(0, 8)
}

async function rerunByMode() {
  if (!connected.value) return

  const queries = buildModeQueries({
    mode: rankingMode.value,
    mood: currentMood.value,
    genres: currentGenres.value,
    searchTermValue: searchTerm.value || currentSearchTerm.value,
    aiQueries: lastAiQueries.value.length ? lastAiQueries.value : currentSearchQueries.value,
  })

  if (queries.length) {
    const modeTracks = await searchSpotifyByQueries(queries)

    if (modeTracks.length > 0) {
      applyTrackResults(modeTracks)
      return
    }
  }

  if (searchTerm.value) {
    await searchSpotify({ skipMoodMapping: false })
  }
}

// async function setRankingMode(mode) {
//   if (rankingMode.value === mode) return
//   rankingMode.value = mode
//   await rerunByMode()
// }

function showNextBatch() {
  if (!tracks.value.length) return
  batchIndex += 3
  if (batchIndex >= tracks.value.length) batchIndex = 0
  updateRecommendations()
}

function updateRecommendations() {
  const pool = tracks.value.slice(batchIndex).concat(tracks.value.slice(0, batchIndex))
  const nextBatch = []
  const usedTrackKeys = new Set()
  const usedArtists = new Set()

  for (const track of pool) {
    if (nextBatch.length >= 3) break

    const trackKey = buildTrackKey(track)
    const artistKey = normalizeArtistName(track.artist)

    if (usedTrackKeys.has(trackKey) || usedArtists.has(artistKey)) {
      continue
    }

    usedTrackKeys.add(trackKey)
    usedArtists.add(artistKey)
    nextBatch.push(track)
  }

  for (const track of pool) {
    if (nextBatch.length >= 3) break

    const trackKey = buildTrackKey(track)

    if (usedTrackKeys.has(trackKey)) {
      continue
    }

    usedTrackKeys.add(trackKey)
    nextBatch.push(track)
  }

  recommendations.value = nextBatch
}

onMounted(async () => {
  await fetchStatus()

  if (moodRecommendations.value.length > 0) {
    applyTrackResults(moodRecommendations.value)

    // 🔁 hydrate search input with AI term if we have it
    if (currentSearchTerm.value) {
      searchTerm.value = currentSearchTerm.value
    } else if (currentMood.value) {
      searchTerm.value = currentMood.value
    }
  }

  const autoSearchRequested = route.query.autoSearch === 'true'
  const routeQuery = String(route.query.q || '').trim()
  const routeMood = String(route.query.mood || '').trim()

  const aiQueries = [...(Array.isArray(currentSearchQueries.value) ? currentSearchQueries.value : [])]
  if (routeQuery) aiQueries.unshift(routeQuery)
  if (routeMood && currentGenres.value?.length) {
    aiQueries.push(`${routeMood} ${currentGenres.value.join(' ')}`)
  }
  const dedupedAiQueries = uniqueQueries(aiQueries)
  lastAiQueries.value = dedupedAiQueries

  if (connected.value && dedupedAiQueries.length) {
    searchTerm.value = currentSearchTerm.value || routeQuery || routeMood
    await rerunByMode()
  } else if (connected.value && currentSearchTerm.value) {
    searchTerm.value = currentSearchTerm.value
    await searchSpotify({ skipMoodMapping: true })
  } else if (connected.value && autoSearchRequested && routeQuery) {
    searchTerm.value = routeQuery
    await searchSpotify({ skipMoodMapping: true })
  } else if (connected.value && autoSearchRequested && routeMood) {
    searchTerm.value = routeMood
    await searchSpotify()
  }
})


</script>


<style scoped>
:root {
  --euphoric: #a18dd6;
  --confident: #8b55f3;
  --flirty: #f584b1;
}

.discover-page {
  position: relative;
  min-height: 100vh;
  padding: 3rem 1.5rem;
  display: flex;
  justify-content: center;
  box-sizing: border-box;
  color: var(--pure);
  overflow: hidden;
  background: transparent;
  z-index: 0;
}

/* animated blobs background to match other pages */
.discover-page::before {
  content: '';
  position: absolute;
  inset: -22% -18%;
  pointer-events: none;
  z-index: -2;
  background-repeat: no-repeat;
  background-image:
    radial-gradient(540px 540px at 12% 18%, color-mix(in srgb, var(--euphoric) 95%, transparent), transparent 60%),
    radial-gradient(480px 480px at 22% 38%, color-mix(in srgb, var(--flirty) 90%, transparent), transparent 60%),
    radial-gradient(520px 520px at 10% 62%, color-mix(in srgb, var(--confident) 92%, transparent), transparent 55%),
    radial-gradient(560px 560px at 78% 26%, color-mix(in srgb, var(--euphoric) 96%, transparent), transparent 60%),
    radial-gradient(520px 520px at 88% 68%, color-mix(in srgb, var(--flirty) 90%, transparent), transparent 60%),
    radial-gradient(460px 460px at 50% 100%, color-mix(in srgb, var(--confident) 93%, transparent), transparent 60%);
  filter: blur(18px);
  opacity: 0.96;
  animation: discover-blobs-main 7s ease-in-out infinite alternate;
}

.discover-page::after {
  content: '';
  position: absolute;
  inset: -28% -20%;
  pointer-events: none;
  z-index: -1;
  background-repeat: no-repeat;
  background-image:
    radial-gradient(340px 520px at 18% 92%, color-mix(in srgb, var(--euphoric) 85%, transparent), transparent 70%),
    radial-gradient(360px 520px at 82% 80%, color-mix(in srgb, var(--flirty) 80%, transparent), transparent 72%),
    radial-gradient(320px 480px at 50% 110%, color-mix(in srgb, var(--confident) 80%, transparent), transparent 70%);
  filter: blur(22px);
  opacity: 0.85;
  animation: discover-blobs-accent 5.2s ease-in-out infinite alternate;
}

@keyframes discover-blobs-main {
  0% {
    transform: translate3d(-36px, -26px, 0) scale(0.9);
    opacity: 0.9;
  }
  25% {
    transform: translate3d(20px, -8px, 0) scale(1.03);
    opacity: 1;
  }
  50% {
    transform: translate3d(42px, 24px, 0) scale(1.09);
    opacity: 1;
  }
  75% {
    transform: translate3d(-16px, 42px, 0) scale(1.02);
    opacity: 0.96;
  }
  100% {
    transform: translate3d(-40px, 56px, 0) scale(0.96);
    opacity: 0.9;
  }
}

@keyframes discover-blobs-accent {
  0% {
    transform: translate3d(34px, 36px, 0) scale(0.92);
    opacity: 0.4;
  }
  20% {
    transform: translate3d(12px, 10px, 0) scale(1.06);
    opacity: 0.7;
  }
  50% {
    transform: translate3d(-30px, -22px, 0) scale(1.14);
    opacity: 0.95;
  }
  80% {
    transform: translate3d(-8px, -42px, 0) scale(1.02);
    opacity: 0.55;
  }
  100% {
    transform: translate3d(26px, -54px, 0) scale(0.94);
    opacity: 0.35;
  }
}

.content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

/* Header */
.content-header {
  margin-bottom: 1.75rem;
  padding: 1.1rem 1.5rem;
  border-radius: 1.4rem;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--confident) 60%, transparent),
    color-mix(in srgb, var(--euphoric) 60%, transparent),
    color-mix(in srgb, var(--flirty) 40%, transparent)
  );
  backdrop-filter: blur(14px) saturate(130%);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  /* background: linear-gradient(90deg, #ffffff, #f6e9ff); */
  color: var(--confident);
  /* -webkit-background-clip: text; */
  /* -webkit-text-fill-color: transparent; */
}

/* Search bar */
.search-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 1.75rem 0 2rem;
  padding: 0.7rem 0.8rem;
  border-radius: 999px;
  background: rgba(8, 8, 18, 0.75);
  backdrop-filter: blur(16px) saturate(135%);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
}

.search-bar input {
  flex: 1;
  padding: 0.55rem 1rem;
  border-radius: 999px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 0.95rem;
}

/* remove blue line on click, custom focus style */
.search-bar input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.search-bar input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.search-bar button {
  padding: 0.55rem 1.2rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  color: white;
  background: linear-gradient(90deg, var(--confident), var(--euphoric), var(--flirty));
  white-space: nowrap;
}

.search-bar button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.mode-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.mode-btn {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  border-radius: 999px;
  padding: 0.45rem 0.75rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  cursor: pointer;
}

.mode-btn.active {
  background: linear-gradient(120deg, #7f5af0, #a78bfa);
  border-color: transparent;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

/* glassy login prompt card */
.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin: 2.2rem 0;
  padding: 2rem 1.5rem;
  border-radius: 1.5rem;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--confident) 55%, transparent),
    color-mix(in srgb, var(--euphoric) 55%, transparent),
    color-mix(in srgb, var(--flirty) 35%, transparent)
  );
  backdrop-filter: blur(14px) saturate(130%);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.26);
}

.login-prompt p {
  color: #f5f1ff;
  font-size: 0.95rem;
}

/* Recommendations Grid – glassy container */
.grid {
  margin-top: 1.5rem;
  padding: 1.75rem 1.5rem;
  border-radius: 1.6rem;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--confident) 45%, transparent),
    color-mix(in srgb, var(--euphoric) 45%, transparent),
    color-mix(in srgb, var(--flirty) 35%, transparent)
  );
  backdrop-filter: blur(16px) saturate(135%);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.8rem;
}

.tile {
  background: rgba(5, 5, 15, 0.55);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.25s, box-shadow 0.25s, background 0.25s;
}

.tile:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.35);
  background: rgba(10, 10, 26, 0.75);
}

.cover-wrap {
  width: 100%;
  aspect-ratio: 1/1;
  overflow: hidden;
  border-radius: 1rem;
  margin-bottom: 0.8rem;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
}

.cover-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.title {
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.25rem;
  text-align: center;
}

.artist {
  color: #ddd;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

iframe {
  border-radius: 0.75rem;
  overflow: hidden;
}

.status-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  margin: 1.75rem 0;
  padding: 2rem 1.5rem;
  border-radius: 1.4rem;
  background: rgba(8, 8, 18, 0.72);
  backdrop-filter: blur(16px) saturate(135%);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.28);
  text-align: center;
}

.status-card-search {
  margin-top: 0;
}

.status-card p {
  margin: 0;
  color: #f5f1ff;
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #ffffff;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* responsive tweaks */
@media (max-width: 768px) {
  .discover-page {
    padding: 2.2rem 1rem;
  }

  .content-header {
    padding: 0.9rem 1.2rem;
  }

  .section-title {
    font-size: 1.4rem;
    letter-spacing: 0.1em;
  }

  .search-bar {
    flex-direction: column;
    align-items: stretch;
    border-radius: 1.4rem;
  }

  .mode-toggle {
    width: 100%;
    justify-content: stretch;
  }

  .mode-btn {
    flex: 1;
  }

  .search-bar button {
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .grid {
    padding: 1.4rem 1.1rem;
  }
}
</style>
