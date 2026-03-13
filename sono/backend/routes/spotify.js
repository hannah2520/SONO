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

  if (response.status === 504) {
    throw new Error('Spotify service timeout.')
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
  ] = await Promise.allSettled([
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

  const readItems = (result, mapper = (value) => value) => {
    if (result.status === 'fulfilled') {
      return mapper(result.value)
    }

    console.error('Spotify taste profile request failed:', result.reason?.message || result.reason)
    return []
  }

  return {
    profile: profile.status === 'fulfilled' ? profile.value : null,
    artists: [
      ...readItems(topArtistsShort, (value) => value.items || []),
      ...readItems(topArtistsMedium, (value) => value.items || []),
    ],
    tracks: [
      ...readItems(topTracksShort, (value) => value.items || []),
      ...readItems(topTracksMedium, (value) => value.items || []),
      ...readItems(recentlyPlayed, (value) => (value.items || []).map((i) => i.track).filter(Boolean)),
      ...readItems(savedTracks, (value) => (value.items || []).map((i) => i.track).filter(Boolean)),
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

function getCachedSearchResults(req, query) {
  const cache = req.session.spotifySearchCache || {}
  const cached = cache[query]

  if (!cached) {
    return null
  }

  if (cached.expiresAt <= Date.now()) {
    delete cache[query]
    req.session.spotifySearchCache = cache
    return null
  }

  return cached.data
}

function setCachedSearchResults(req, query, tracks) {
  const cache = req.session.spotifySearchCache || {}

  cache[query] = {
    data: tracks,
    expiresAt: Date.now() + 1000 * 60 * 5,
  }

  req.session.spotifySearchCache = cache
}

/* -----------------------------
   BUILD SEARCH QUERIES
----------------------------- */

function buildSearchQueries(query, taste) {
  const queries = new Set()

  queries.add(query)

  if (!taste) {
    return [...queries]
  }

  const artists = Array.isArray(taste.artists) ? taste.artists : []
  const tracks = Array.isArray(taste.tracks) ? taste.tracks : []

  artists.slice(0, 5).forEach((artist) => {
    queries.add(`${query} ${artist.name}`)
  })

  tracks.slice(0, 5).forEach((track) => {
    if (track?.artists?.[0]?.name) {
      queries.add(`${query} ${track.artists[0].name}`)
    }
  })

  return [...queries].slice(0, 4)
}

function buildFallbackQueries(query) {
  const normalized = String(query || '').trim()

  if (!normalized) {
    return []
  }

  const variants = new Set([normalized])
  const compact = normalized.replace(/\s+/g, ' ').trim()
  const punctuationStripped = compact.replace(/[^\w\s&/-]+/g, ' ').replace(/\s+/g, ' ').trim()
  const firstClause = compact.split(/[,:-]/)[0]?.trim()

  if (punctuationStripped) {
    variants.add(punctuationStripped)
  }

  if (firstClause) {
    variants.add(firstClause)
  }

  return [...variants].filter(Boolean).slice(0, 3)
}

/* -----------------------------
   GET PERSONALIZED TRACKS
----------------------------- */

async function getPersonalizedTracks(token, queries) {
  const results = []
  const searches = await Promise.allSettled(
    queries.map((query) => {
      const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query,
      )}&type=track&limit=20&offset=0`

      return spotifyFetchJson(url, token)
    }),
  )

  searches.forEach((result) => {
    if (result.status === 'fulfilled' && result.value?.tracks?.items) {
      results.push(...result.value.tracks.items)
      return
    }

    if (result.status === 'rejected') {
      console.error('Spotify query failed:', result.reason.message)
    }
  })

  const unique = new Map()

  results.forEach((track) => {
    if (!unique.has(track.id)) {
      unique.set(track.id, track)
    }
  })

  return [...unique.values()].slice(0, 24)
}

async function searchTracksWithFallback(token, query, taste) {
  const personalizedQueries = buildSearchQueries(query, taste)
  const personalizedTracks = await getPersonalizedTracks(token, personalizedQueries)

  if (personalizedTracks.length > 0) {
    return personalizedTracks
  }

  const fallbackQueries = buildFallbackQueries(query).filter(
    (candidate) => !personalizedQueries.includes(candidate),
  )

  if (fallbackQueries.length === 0) {
    return personalizedTracks
  }

  return getPersonalizedTracks(token, fallbackQueries)
}

async function searchTracksSafely(token, query, taste) {
  try {
    return await searchTracksWithFallback(token, query, taste)
  } catch (error) {
    console.error('Spotify personalized search failed, retrying plain query:', error.message)
    return getPersonalizedTracks(token, [query])
  }
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

    const query = String(req.query.q || '').trim()

    if (!query) {
      return res.status(400).json({ error: 'Query required' })
    }

    const cachedTracks = getCachedSearchResults(req, query)

    if (cachedTracks) {
      return res.json({ tracks: cachedTracks, cached: true })
    }

    let taste = null

    try {
      taste = await getCachedTasteProfile(req, token)
    } catch (error) {
      console.error('Spotify taste profile unavailable, falling back to plain search:', error.message)
    }

    const tracks = await searchTracksSafely(token, query, taste)

    if (tracks.length > 0) {
      setCachedSearchResults(req, query, tracks)
    }

    res.json({ tracks })
  } catch (error) {
    console.error('Error during Spotify search:', error.message)
    res.json({
      tracks: [],
      degraded: true,
      error: error.message,
    })
  }
})

export default router
