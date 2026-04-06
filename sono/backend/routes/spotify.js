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
