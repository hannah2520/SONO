import express from 'express'
import fetch from 'node-fetch'

const router = express.Router()

/* -----------------------------
   SPOTIFY FETCH WITH 429 HANDLING
----------------------------- */

async function spotifyFetchJson(url, token) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.status === 429) {
    const retryAfter = response.headers.get('retry-after')
    throw new Error(`Spotify rate limited. Retry after ${retryAfter || 'a few'} seconds.`)
  }

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Spotify request failed (${response.status}): ${body}`)
  }

  return response.json()
}

/* -----------------------------
   BUILD TASTE PROFILE
----------------------------- */

async function buildTasteProfile(token) {
  const [
    profile,
    topArtistsShort,
    topArtistsMedium,
    topTracksShort,
    topTracksMedium,
    recentlyPlayed,
    savedTracks,
  ] = await Promise.all([
    spotifyFetchJson('https://api.spotify.com/v1/me', token),
    spotifyFetchJson(
      'https://api.spotify.com/v1/me/top/artists?limit=20&time_range=short_term',
      token,
    ),
    spotifyFetchJson(
      'https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term',
      token,
    ),
    spotifyFetchJson(
      'https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=short_term',
      token,
    ),
    spotifyFetchJson(
      'https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term',
      token,
    ),
    spotifyFetchJson('https://api.spotify.com/v1/me/player/recently-played?limit=20', token),
    spotifyFetchJson('https://api.spotify.com/v1/me/tracks?limit=20', token),
  ])

  return {
    profile,
    artists: [...topArtistsShort.items, ...topArtistsMedium.items],
    tracks: [
      ...topTracksShort.items,
      ...topTracksMedium.items,
      ...recentlyPlayed.items.map((i) => i.track),
      ...savedTracks.items.map((i) => i.track),
    ],
  }
}

/* -----------------------------
   CACHE TASTE PROFILE
----------------------------- */

async function getCachedTasteProfile(req, token) {
  const now = Date.now()
  const cached = req.session.tasteProfileCache

  if (cached && cached.expiresAt > now) {
    return cached.data
  }

  const data = await buildTasteProfile(token)

  req.session.tasteProfileCache = {
    data,
    expiresAt: now + 1000 * 60 * 10,
  }

  return data
}

/* -----------------------------
   BUILD SEARCH QUERIES
----------------------------- */

function buildSearchQueries(query, taste) {
  const queries = new Set()

  queries.add(query)

  taste.artists.slice(0, 5).forEach((artist) => {
    queries.add(`${query} ${artist.name}`)
  })

  taste.tracks.slice(0, 5).forEach((track) => {
    if (track?.artists?.[0]?.name) {
      queries.add(`${query} ${track.artists[0].name}`)
    }
  })

  return [...queries].slice(0, 6)
}

/* -----------------------------
   GET PERSONALIZED TRACKS
----------------------------- */

async function getPersonalizedTracks(token, queries) {
  const results = []

  for (const query of queries) {
    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      query,
    )}&type=track&limit=50&offset=0`

    const data = await spotifyFetchJson(url, token)

    if (data?.tracks?.items) {
      results.push(...data.tracks.items)
    }
  }

  const unique = new Map()

  results.forEach((track) => {
    if (!unique.has(track.id)) {
      unique.set(track.id, track)
    }
  })

  return [...unique.values()].slice(0, 50)
}

/* -----------------------------
   SEARCH ROUTE
----------------------------- */

router.get('/search', async (req, res) => {
  try {
    const token = req.session.spotifyToken

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated with Spotify' })
    }

    const query = req.query.q

    if (!query) {
      return res.status(400).json({ error: 'Query required' })
    }

    const taste = await getCachedTasteProfile(req, token)

    const queries = buildSearchQueries(query, taste)

    const tracks = await getPersonalizedTracks(token, queries)

    res.json({ tracks })
  } catch (error) {
    console.error('Error during Spotify search:', error.message)
    res.status(500).json({ error: error.message })
  }
})

export default router
