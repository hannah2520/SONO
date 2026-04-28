import express from 'express'
import fetch from 'node-fetch'

const router = express.Router()

const SPOTIFY_ACCOUNTS_URL = 'https://accounts.spotify.com'
const SPOTIFY_API_URL = 'https://api.spotify.com/v1'
const DEFAULT_SCOPES = [
  'user-read-email',
  'user-read-private',
  'user-top-read',
  'user-read-recently-played',
  'user-library-read',
  'user-library-modify',
]

function rankByCount(items) {
  const counts = new Map()
  for (const item of items) {
    const key = String(item || '').trim()
    if (!key) continue
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([key]) => key)
}

function unique(items) {
  const seen = new Set()
  const out = []
  for (const item of items) {
    const key = String(item || '').trim()
    if (!key) continue
    if (!seen.has(key)) {
      seen.add(key)
      out.push(key)
    }
  }
  return out
}

function normalizeReturnToUrl(returnTo) {
  const fallback = process.env.APP_ORIGIN || 'http://127.0.0.1:5173/sono/'
  const raw = String(returnTo || fallback).trim()

  try {
    const parsed = new URL(raw)

    if (!parsed.pathname || parsed.pathname === '/') {
      parsed.pathname = '/sono/'
    }

    return parsed.toString()
  } catch {
    return fallback
  }
}

function buildSpotifyAuthorizeUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID || '',
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI || '',
    scope: DEFAULT_SCOPES.join(' '),
    state,
    show_dialog: 'true',
  })

  return `${SPOTIFY_ACCOUNTS_URL}/authorize?${params.toString()}`
}

async function exchangeCodeForToken(code) {
  const basicAuth = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID || ''}:${process.env.SPOTIFY_CLIENT_SECRET || ''}`,
  ).toString('base64')

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI || '',
  })

  const response = await fetch(`${SPOTIFY_ACCOUNTS_URL}/api/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.access_token) {
    const detail = data?.error_description || data?.error || response.statusText
    throw new Error(`Spotify token exchange failed: ${detail}`)
  }

  return data
}

async function fetchSpotifyProfile(accessToken) {
  const response = await fetch(`${SPOTIFY_API_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Spotify profile fetch failed (${response.status}): ${body}`)
  }

  return response.json()
}

router.get('/login', (req, res) => {
  if (
    !process.env.SPOTIFY_CLIENT_ID ||
    !process.env.SPOTIFY_CLIENT_SECRET ||
    !process.env.SPOTIFY_REDIRECT_URI
  ) {
    return res.status(500).json({ error: 'Spotify environment variables are not configured' })
  }

  const origin = req.get('origin') || process.env.APP_ORIGIN
  const returnTo = req.query.returnTo || origin

  const state = Math.random().toString(36).slice(2)
  req.session.spotifyAuthState = state
  req.session.spotifyAuthReturnTo = normalizeReturnToUrl(returnTo)

  return res.redirect(buildSpotifyAuthorizeUrl(state))
})

router.get('/callback', async (req, res) => {
  const code = String(req.query.code || '').trim()
  const state = String(req.query.state || '').trim()
  const expectedState = String(req.session.spotifyAuthState || '').trim()

  const returnTo = normalizeReturnToUrl(req.session.spotifyAuthReturnTo)

  if (!code) {
    return res.redirect(`${returnTo}?spotify=error&reason=missing_code`)
  }

  if (!state || !expectedState || state !== expectedState) {
    return res.redirect(`${returnTo}?spotify=error&reason=invalid_state`)
  }

  try {
    const tokenData = await exchangeCodeForToken(code)
    const profile = await fetchSpotifyProfile(tokenData.access_token)

    req.session.spotifyToken = tokenData.access_token
    req.session.spotifyRefreshToken = tokenData.refresh_token || req.session.spotifyRefreshToken
    req.session.spotifyTokenExpiresAt =
      Date.now() + Number(tokenData.expires_in || 3600) * 1000
    req.session.spotifyProfile = profile
    req.session.spotifyAuthState = null

    return res.redirect(`${returnTo}?spotify=connected`)
  } catch (error) {
    console.error('Spotify callback failed:', error.message)
    return res.redirect(`${returnTo}?spotify=error&reason=callback_failed`)
  }
})

router.get('/status', (req, res) => {
  const connected = Boolean(req.session.spotifyToken)

  return res.json({
    connected,
    profile: connected ? req.session.spotifyProfile || null : null,
    expiresAt: connected ? req.session.spotifyTokenExpiresAt || null : null,
  })
})

router.post('/logout', (req, res) => {
  req.session.spotifyToken = null
  req.session.spotifyRefreshToken = null
  req.session.spotifyTokenExpiresAt = null
  req.session.spotifyProfile = null
  req.session.tasteProfileCache = null
  req.session.spotifySearchCache = null
  req.session.spotifyAuthState = null
  req.session.spotifyAuthReturnTo = null

  return res.json({ ok: true })
})

/* -----------------------------
   SPOTIFY FETCH WITH 429 HANDLING
----------------------------- */

async function refreshAccessToken(req) {
  const refreshToken = req.session.spotifyRefreshToken
  if (!refreshToken) throw new Error('No refresh token available — please reconnect Spotify')

  const basicAuth = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID || ''}:${process.env.SPOTIFY_CLIENT_SECRET || ''}`,
  ).toString('base64')

  const response = await fetch(`${SPOTIFY_ACCOUNTS_URL}/api/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }).toString(),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.access_token) {
    throw new Error('Token refresh failed — please reconnect Spotify')
  }

  req.session.spotifyToken = data.access_token
  req.session.spotifyTokenExpiresAt = Date.now() + Number(data.expires_in || 3600) * 1000
  if (data.refresh_token) req.session.spotifyRefreshToken = data.refresh_token

  return data.access_token
}

async function getValidToken(req) {
  const expiresAt = req.session.spotifyTokenExpiresAt || 0
  // Refresh 60s before expiry
  if (Date.now() > expiresAt - 60_000) {
    return refreshAccessToken(req)
  }
  return req.session.spotifyToken
}

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
   GENRE SEED MAPPING
----------------------------- */

const SPOTIFY_SEED_GENRES = new Set([
  'acoustic', 'afrobeat', 'alt-rock', 'alternative', 'ambient', 'chill',
  'classical', 'club', 'country', 'dance', 'dancehall', 'disco',
  'drum-and-bass', 'dub', 'dubstep', 'edm', 'electro', 'electronic',
  'emo', 'folk', 'funk', 'gospel', 'grunge', 'hip-hop', 'house',
  'idm', 'indie', 'indie-pop', 'jazz', 'k-pop', 'latin', 'metal',
  'new-age', 'party', 'piano', 'pop', 'punk', 'punk-rock', 'r-n-b',
  'rainy-day', 'reggae', 'reggaeton', 'rock', 'romance', 'sad',
  'singer-songwriter', 'sleep', 'soul', 'soundtracks', 'study',
  'summer', 'synth-pop', 'techno', 'trance', 'trip-hop', 'work-out',
])

function mapToSpotifyGenreSeed(genre) {
  const g = String(genre || '').toLowerCase().trim()
  if (SPOTIFY_SEED_GENRES.has(g)) return g

  const overrides = {
    'hip hop': 'hip-hop', 'rap': 'hip-hop', 'trap': 'hip-hop',
    'melodic rap': 'hip-hop', 'pop rap': 'pop', 'drill': 'hip-hop',
    'mumble rap': 'hip-hop', 'conscious hip hop': 'hip-hop',
    'underground hip hop': 'hip-hop', 'east coast hip hop': 'hip-hop',
    'west coast rap': 'hip-hop', 'gangster rap': 'hip-hop',
    'dirty south rap': 'hip-hop', 'dark trap': 'hip-hop',
    'pluggnb': 'r-n-b', 'rage': 'hip-hop',
    'r&b': 'r-n-b', 'rnb': 'r-n-b', 'neo soul': 'soul',
    'contemporary r&b': 'r-n-b', 'alternative r&b': 'r-n-b',
    'indie rock': 'indie', 'indie pop': 'indie-pop',
    'art pop': 'pop', 'electropop': 'pop', 'dance pop': 'pop',
    'lo-fi': 'chill', 'lo fi': 'chill', 'lofi': 'chill',
    'lofi hip hop': 'chill', 'chillhop': 'chill',
    'latin pop': 'latin', 'afrobeats': 'afrobeat',
    'g funk': 'hip-hop', 'slap house': 'house', 'future bass': 'electronic',
  }
  if (overrides[g]) return overrides[g]

  if (g.includes('hip hop') || g.includes('hip-hop') || g.includes('rap') || g.includes('trap')) return 'hip-hop'
  if (g.includes('r&b') || g.includes('rnb') || g.includes('neo soul')) return 'r-n-b'
  if (g.includes('soul')) return 'soul'
  if (g.includes('indie')) return 'indie'
  if (g.includes('pop')) return 'pop'
  if (g.includes('rock')) return 'rock'
  if (g.includes('electronic') || g.includes('edm') || g.includes('house') || g.includes('techno')) return 'electronic'
  if (g.includes('country')) return 'country'
  if (g.includes('jazz')) return 'jazz'
  if (g.includes('classical') || g.includes('piano')) return 'classical'
  if (g.includes('latin') || g.includes('reggaeton')) return 'latin'
  if (g.includes('folk') || g.includes('acoustic')) return 'acoustic'
  if (g.includes('metal')) return 'metal'
  if (g.includes('punk')) return 'punk'
  if (g.includes('chill') || g.includes('lo')) return 'chill'
  return null
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

  // Use artist: filter so Spotify matches by artist identity, not keyword title overlap
  artists.slice(0, 3).forEach((artist) => {
    if (artist?.name) queries.add(`artist:"${artist.name}"`)
  })

  tracks.slice(0, 2).forEach((track) => {
    const artistName = track?.artists?.[0]?.name
    if (artistName) queries.add(`artist:"${artistName}"`)
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
    if (!req.session.spotifyToken) {
      return res.status(401).json({ error: 'Not authenticated with Spotify' })
    }

    const token = await getValidToken(req)

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

/* -----------------------------
   SAVE TRACK ROUTE
----------------------------- */

router.put('/save', async (req, res) => {
  try {
    if (!req.session.spotifyToken) {
      return res.status(401).json({ error: 'Not authenticated with Spotify' })
    }

    const token = await getValidToken(req)
    const trackId = String(req.body.trackId || '').trim()

    if (!trackId) {
      return res.status(400).json({ error: 'trackId required' })
    }

    const response = await fetch(`https://api.spotify.com/v1/me/tracks`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids: [trackId] }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Spotify save failed (${response.status}): ${body}`)
    }

    res.json({ ok: true })
  } catch (error) {
    console.error('Save track error:', error.message)
    res.status(500).json({ error: error.message })
  }
})

/* -----------------------------
   MOOD RECOMMENDATIONS ROUTE
   Uses Spotify Recommendations API (audio-feature based, not text search)
   so results are sonically matched — not title-matched.
----------------------------- */

router.get('/mood-recommendations', async (req, res) => {
  try {
    if (!req.session.spotifyToken) {
      return res.status(401).json({ error: 'Not authenticated with Spotify' })
    }

    const token = await getValidToken(req)

    const valence = Math.min(1, Math.max(0, parseFloat(req.query.valence) || 0.5))
    const energy = Math.min(1, Math.max(0, parseFloat(req.query.energy) || 0.5))
    const limit = Math.min(50, Math.max(10, parseInt(req.query.limit) || 30))

    const taste = await getCachedTasteProfile(req, token)

    // Prefer short-term top artists (first 20 in the combined array) as seeds
    const seedArtistIds = unique(
      (taste.artists || []).slice(0, 20).filter((a) => a?.id).map((a) => a.id),
    ).slice(0, 2)

    // Map user's top genres to valid Spotify seed genres
    const allUserGenres = rankByCount(
      (taste.artists || []).slice(0, 20).flatMap((a) => a.genres || []),
    )
    const seedGenres = []
    for (const genre of allUserGenres) {
      const mapped = mapToSpotifyGenreSeed(genre)
      if (mapped && !seedGenres.includes(mapped)) seedGenres.push(mapped)
      if (seedGenres.length >= 3) break
    }

    // Spotify requires at least 1 seed total (max 5 combined)
    const totalSeeds = seedArtistIds.length + seedGenres.length
    if (totalSeeds === 0) {
      return res.json({ tracks: [], fallback: true })
    }

    // Keep total seeds ≤ 5
    const usedArtists = seedArtistIds.slice(0, Math.min(2, 5 - Math.min(seedGenres.length, 2)))
    const usedGenres = seedGenres.slice(0, Math.min(seedGenres.length, 5 - usedArtists.length))

    const params = new URLSearchParams({ limit })
    if (usedArtists.length) params.set('seed_artists', usedArtists.join(','))
    if (usedGenres.length) params.set('seed_genres', usedGenres.join(','))
    params.set('target_valence', valence.toFixed(3))
    params.set('target_energy', energy.toFixed(3))
    // Allow some range so results aren't too narrow
    params.set('min_valence', Math.max(0, valence - 0.25).toFixed(3))
    params.set('max_valence', Math.min(1, valence + 0.25).toFixed(3))
    params.set('min_energy', Math.max(0, energy - 0.25).toFixed(3))
    params.set('max_energy', Math.min(1, energy + 0.25).toFixed(3))
    params.set('min_popularity', '15')
    params.set('max_popularity', '88')

    const data = await spotifyFetchJson(
      `${SPOTIFY_API_URL}/recommendations?${params.toString()}`,
      token,
    )

    const tracks = data.tracks || []
    res.json({ tracks })
  } catch (error) {
    console.error('Mood recommendations error:', error.message)
    res.json({ tracks: [], error: error.message, fallback: true })
  }
})

/* -----------------------------
   SIMILAR ARTIST ROUTE
----------------------------- */

router.get('/similar', async (req, res) => {
  try {
    if (!req.session.spotifyToken) {
      return res.status(401).json({ error: 'Not authenticated with Spotify' })
    }

    const token = await getValidToken(req)
    const artistName = String(req.query.artist || '').trim()

    if (!artistName) {
      return res.status(400).json({ error: 'Artist name required' })
    }

    // 1. Find the artist on Spotify
    const searchData = await spotifyFetchJson(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
      token,
    )

    const seedArtist = searchData?.artists?.items?.[0]

    if (!seedArtist) {
      return res.json({ tracks: [], seedArtist: null })
    }

    // 2. Get related artists
    const relatedData = await spotifyFetchJson(
      `https://api.spotify.com/v1/artists/${seedArtist.id}/related-artists`,
      token,
    )

    // Only use related artists — exclude the seed artist's own tracks
    const relatedArtists = (relatedData?.artists || []).slice(0, 8)

    // 3. Get top tracks from related artists only
    const topTrackResults = await Promise.allSettled(
      relatedArtists.map((artist) =>
        spotifyFetchJson(
          `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`,
          token,
        ),
      ),
    )

    const seen = new Set()
    const tracks = []

    topTrackResults.forEach((result) => {
      if (result.status !== 'fulfilled') return
      const items = result.value?.tracks || []
      items.slice(0, 3).forEach((track) => {
        if (!seen.has(track.id)) {
          seen.add(track.id)
          tracks.push(track)
        }
      })
    })

    res.json({ tracks, seedArtist: seedArtist.name })
  } catch (error) {
    console.error('Similar artist search failed:', error.message)
    res.json({ tracks: [], error: error.message })
  }
})

export default router
