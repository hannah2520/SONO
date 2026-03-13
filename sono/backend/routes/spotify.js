import express from 'express'
import process from 'process'
import fetch from 'node-fetch'
import { OpenAI } from 'openai'

const router = express.Router()

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

const SPOTIFY_REDIRECT_URI =
  process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:10000/api/auth/callback'

const APP_ORIGIN = process.env.APP_ORIGIN || 'http://127.0.0.1:5173'

const DEFAULT_SCOPES =
  process.env.SPOTIFY_SCOPES ||
  'user-read-email user-read-private user-top-read user-read-recently-played user-library-read'

const MOOD_FAMILY_PROFILES = {
  sad: {
    matcher: /(sad|down|depressed|blue|heartbreak|heartbroken|grief|cry|lonely|melanch|hurt)/i,
    blockedQueryTerms:
      /(party|hype|club|rage|banger|drill|dancefloor|festival|upbeat|turn\s?up|lit)/i,
    blockedGenres: /(edm|dance|house|techno|drill|hardstyle|dubstep|hyperpop)/i,
    preferredQueries: [
      'sad melancholic indie r&b',
      'emotional r&b slow vocals',
      'acoustic heartbreak indie folk',
      'melancholy alt r&b night',
      'soft sad soul ballad',
    ],
    preferredGenreHints: ['r&b', 'soul', 'indie', 'indie folk', 'acoustic'],
    familiarityCap: 0.2,
    avoidTasteBias: true,
    strictFilter: true,
    titlePenalty: /(party|hype|club|rage|drill|dance|remix|nightcore|sped up)/i,
    titleBonus: /(acoustic|piano|rain|blue|slow|sad|melanch|heart)/i,
  },
  calm: {
    matcher: /(calm|relax|peace|gentle|soothing|quiet|sleep|decompress|wind down)/i,
    blockedQueryTerms: /(hype|rage|party|drill|hard|aggressive|intense)/i,
    blockedGenres: /(drill|hardstyle|metalcore|dubstep)/i,
    preferredQueries: [
      'calm ambient soft vocals',
      'gentle acoustic chill',
      'peaceful indie downtempo',
    ],
    preferredGenreHints: ['ambient', 'acoustic', 'indie', 'lo-fi', 'soft pop'],
    familiarityCap: 0.25,
    avoidTasteBias: false,
    titlePenalty: /(rage|hard|loud|club|party|drill)/i,
    titleBonus: /(ambient|chill|calm|soft|acoustic|sleep)/i,
  },
  focus: {
    matcher: /(focus|study|work mode|productive|locked in|deep work)/i,
    blockedQueryTerms: /(party|hype|club|drill|rage|chaotic)/i,
    blockedGenres: /(drill|rage|hardstyle|hyperpop)/i,
    preferredQueries: [
      'focus instrumental electronic',
      'study beats no distractions',
      'deep work lo-fi instrumental',
    ],
    preferredGenreHints: ['instrumental', 'lo-fi', 'ambient', 'electronic'],
    familiarityCap: 0.22,
    avoidTasteBias: false,
    titlePenalty: /(party|club|rage|drill|remix)/i,
    titleBonus: /(instrumental|focus|study|ambient|lofi|beats)/i,
  },
  happy: {
    matcher: /(happy|joy|sunny|cheerful|smile|uplift|good mood)/i,
    blockedQueryTerms: /(sad|heartbreak|depress|grief|cry)/i,
    blockedGenres: /(funeral|doom)/i,
    preferredQueries: [
      'upbeat pop feel good',
      'happy melodic indie pop',
      'positive energy dance pop',
    ],
    preferredGenreHints: ['pop', 'dance pop', 'indie pop', 'funk'],
    familiarityCap: 0.3,
    avoidTasteBias: false,
    titlePenalty: /(sad|cry|heartbreak|alone)/i,
    titleBonus: /(happy|sunshine|dance|good vibes|bright)/i,
  },
  energetic: {
    matcher: /(energetic|hype|workout|gym|pump|adrenaline|high energy)/i,
    blockedQueryTerms: /(sleep|calm|sad ballad|depress|slow)/i,
    blockedGenres: /(ambient|sleep|meditation)/i,
    preferredQueries: ['high energy workout', 'hype trap workout', 'driving electronic energy'],
    preferredGenreHints: ['hip hop', 'electronic', 'pop', 'rock'],
    familiarityCap: 0.3,
    avoidTasteBias: false,
    titlePenalty: /(sleep|calm|acoustic lullaby)/i,
    titleBonus: /(energy|hype|power|workout|run)/i,
  },
}

let openai = null

function getOpenAIClient() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      return null
    }

    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  return openai
}

// -----------------------------
// LOGIN → REDIRECT TO SPOTIFY
// -----------------------------
router.get('/login', (req, res) => {
  const state = generateState()
  req.session.spotifyState = state

  const authUrl = new URL('https://accounts.spotify.com/authorize')
  authUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID)
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('redirect_uri', SPOTIFY_REDIRECT_URI)
  authUrl.searchParams.append('scope', DEFAULT_SCOPES)
  authUrl.searchParams.append('state', state)

  res.redirect(authUrl.toString())
})

// -----------------------------
// CALLBACK → EXCHANGE TOKEN
// -----------------------------
router.get('/callback', async (req, res) => {
  const { code, state } = req.query

  if (state !== req.session.spotifyState) {
    return res.status(400).json({ error: 'State mismatch' })
  }

  try {
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        client_secret: SPOTIFY_CLIENT_SECRET,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      console.error('Token exchange failed:', tokenData)
      throw new Error('No access token received')
    }

    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const profile = await profileResponse.json()

    req.session.spotifyToken = tokenData.access_token
    req.session.spotifyRefresh = tokenData.refresh_token
    req.session.profile = {
      id: profile.id,
      display_name: profile.display_name,
      email: profile.email,
      country: profile.country || null,
    }

    res.redirect(`${APP_ORIGIN}/sono/?auth=success`)
  } catch (error) {
    console.error('Auth callback error:', error)
    res.redirect(`${APP_ORIGIN}/sono/?auth=error`)
  }
})

// -----------------------------
// STATUS → IS USER CONNECTED?
// -----------------------------
router.get('/status', (req, res) => {
  const connected = !!req.session.spotifyToken

  res.json({
    connected,
    profile: connected ? req.session.profile : null,
  })
})

// -----------------------------
// LOGOUT
// -----------------------------
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session.spotifyToken = null
    req.session.spotifyRefresh = null
    req.session.profile = null
    req.session.spotifyState = null
  }

  res.json({ success: true })
})

// -----------------------------
// SMART SPOTIFY SEARCH
// -----------------------------
router.get('/search', async (req, res) => {
  const token = req.session.spotifyToken
  const q = String(req.query.q || '').trim()
  const genres = String(req.query.genres || '')
    .split(',')
    .map((genre) => genre.trim())
    .filter(Boolean)

  if (!token) {
    return res.status(401).json({ error: 'Not connected to Spotify' })
  }

  if (!q) {
    return res.status(400).json({ error: 'Missing search query' })
  }

  try {
    const taste = await buildTasteProfile(token)
    const intent = await interpretSearchIntent({
      rawQuery: q,
      genres,
      taste,
    })

    const tracks = await getPersonalizedTracks({
      token,
      rawQuery: q,
      genres,
      taste,
      intent,
      limit: 36,
    })

    res.json({
      tracks,
      based_on_user: true,
      excluded_previously_heard: false,
      interpreted_mood: intent.mood,
      interpreted_queries: intent.searchQueries,
    })
  } catch (err) {
    console.error('Error during Spotify search:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// -----------------------------
// TASTE PROFILE
// -----------------------------
async function buildTasteProfile(token) {
  const [
    me,
    topArtistsShort,
    topArtistsMedium,
    topTracksShort,
    topTracksMedium,
    recentTracks,
    savedTracks,
  ] = await Promise.all([
    spotifyFetchJson('https://api.spotify.com/v1/me', token),
    spotifyFetchJson(
      'https://api.spotify.com/v1/me/top/artists?limit=20&time_range=short_term',
      token,
    ),
    spotifyFetchJson(
      'https://api.spotify.com/v1/me/top/artists?limit=30&time_range=medium_term',
      token,
    ),
    spotifyFetchJson(
      'https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=short_term',
      token,
    ),
    spotifyFetchJson(
      'https://api.spotify.com/v1/me/top/tracks?limit=30&time_range=medium_term',
      token,
    ),
    spotifyFetchJson('https://api.spotify.com/v1/me/player/recently-played?limit=50', token),
    spotifyFetchJson('https://api.spotify.com/v1/me/tracks?limit=50', token),
  ])

  const artistWeights = new Map()
  const topArtistIds = new Set()
  const listenedTrackIds = new Set()
  const savedTrackIds = new Set()
  const genreWeights = new Map()

  const shortArtists = topArtistsShort.items || []
  const mediumArtists = topArtistsMedium.items || []
  const shortTracks = topTracksShort.items || []
  const mediumTracks = topTracksMedium.items || []
  const recentItems = recentTracks.items || []
  const savedItems = savedTracks.items || []

  shortArtists.forEach((artist, index) => {
    topArtistIds.add(artist.id)
    bumpWeight(artistWeights, artist.id, Math.max(28 - index, 10))
    ;(artist.genres || []).forEach((genre) => bumpWeight(genreWeights, genre, 6))
  })

  mediumArtists.forEach((artist, index) => {
    topArtistIds.add(artist.id)
    bumpWeight(artistWeights, artist.id, Math.max(20 - Math.floor(index / 2), 6))
    ;(artist.genres || []).forEach((genre) => bumpWeight(genreWeights, genre, 4))
  })

  shortTracks.forEach((track, index) => {
    if (track?.id) listenedTrackIds.add(track.id)
    ;(track.artists || []).forEach((artist) => {
      bumpWeight(artistWeights, artist.id, Math.max(14 - Math.floor(index / 2), 5))
    })
  })

  mediumTracks.forEach((track, index) => {
    if (track?.id) listenedTrackIds.add(track.id)
    ;(track.artists || []).forEach((artist) => {
      bumpWeight(artistWeights, artist.id, Math.max(10 - Math.floor(index / 3), 3))
    })
  })

  recentItems.forEach((item, index) => {
    if (item?.track?.id) listenedTrackIds.add(item.track.id)
    ;(item?.track?.artists || []).forEach((artist) => {
      bumpWeight(artistWeights, artist.id, Math.max(8 - Math.floor(index / 6), 2))
    })
  })

  savedItems.forEach((item) => {
    if (item?.track?.id) {
      listenedTrackIds.add(item.track.id)
      savedTrackIds.add(item.track.id)
    }

    ;(item?.track?.artists || []).forEach((artist) => {
      bumpWeight(artistWeights, artist.id, 4)
    })
  })

  const preferredArtistNames = rankByWeight(
    [...artistWeights.entries()].map(([artistId, weight]) => ({
      artistId,
      weight,
      name: findArtistName(
        artistId,
        shortArtists,
        mediumArtists,
        shortTracks,
        mediumTracks,
        recentItems,
        savedItems,
      ),
    })),
  )
    .map((item) => item.name)
    .filter(Boolean)
    .slice(0, 8)

  const preferredGenres = rankByWeight(
    [...genreWeights.entries()].map(([genre, weight]) => ({ genre, weight })),
  )
    .map((item) => item.genre)
    .slice(0, 8)

  return {
    market: me.country || null,
    artistWeights,
    topArtistIds,
    listenedTrackIds,
    savedTrackIds,
    preferredArtistNames,
    preferredGenres,
  }
}

// -----------------------------
// QUERY INTERPRETATION
// -----------------------------
async function interpretSearchIntent({ rawQuery, genres, taste }) {
  const normalizedGenres = unique(genres.map((genre) => genre.toLowerCase()))
  const client = getOpenAIClient()

  if (!client) {
    return fallbackInterpretSearchIntent(rawQuery, normalizedGenres, taste)
  }

  try {
    const tasteSummary = [
      taste.preferredArtistNames?.length
        ? `top artists: ${taste.preferredArtistNames.slice(0, 6).join(', ')}`
        : null,
      taste.preferredGenres?.length
        ? `top genres: ${taste.preferredGenres.slice(0, 6).join(', ')}`
        : null,
    ]
      .filter(Boolean)
      .join(' | ')

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      temperature: 0.85,
      max_completion_tokens: 450,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'sono_search_intent',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              mood: { type: 'string' },
              genreHints: {
                type: 'array',
                items: { type: 'string' },
                maxItems: 6,
              },
              searchQueries: {
                type: 'array',
                items: { type: 'string' },
                maxItems: 10,
              },
              familiarRatio: {
                type: 'number',
                minimum: 0,
                maximum: 0.5,
              },
            },
            required: ['mood', 'genreHints', 'searchQueries', 'familiarRatio'],
          },
        },
      },
      messages: [
        {
          role: 'system',
          content: [
            'You are generating Spotify retrieval intent for SONO, a mood-based discovery app.',
            'Interpret the user query as a musical mood and sonic texture, not as a literal keyword search.',
            'Never echo back situational phrases like "after work" or "for class" as the main query.',
            'Translate life situations into emotional and sonic moods.',
            'The mood should be a short vibe phrase.',
            'The searchQueries should be music-searchable and mood-first, combining emotion, texture, genre, instrumentation, era, vocal feeling, or movement.',
            'Use the taste profile to make results feel personal.',
            'Return a familiarRatio between 0.15 and 0.35 for a healthy mix of discovery and a little familiarity.',
          ].join(' '),
        },
        {
          role: 'user',
          content: JSON.stringify({
            rawQuery,
            explicitGenres: normalizedGenres,
            tasteSummary,
          }),
        },
      ],
    })

    const parsed = parseStructuredPayload(response.choices?.[0]?.message?.content)

    const intent = {
      mood: normalizePhrase(parsed?.mood || rawQuery, 60),
      genreHints: unique(
        (parsed?.genreHints || []).map((genre) => normalizePhrase(genre, 30)),
      ).slice(0, 6),
      searchQueries: unique(
        (parsed?.searchQueries || []).map((query) => normalizePhrase(query, 90)).filter(Boolean),
      ).slice(0, 10),
      familiarRatio: clampNumber(parsed?.familiarRatio, 0.15, 0.35, 0.22),
    }

    return applyMoodGuardrails(intent, rawQuery, normalizedGenres)
  } catch (error) {
    console.error('Failed to interpret search intent with OpenAI:', error)
    return applyMoodGuardrails(
      fallbackInterpretSearchIntent(rawQuery, normalizedGenres, taste),
      rawQuery,
      normalizedGenres,
    )
  }
}

function fallbackInterpretSearchIntent(rawQuery, genres, taste) {
  const lower = String(rawQuery || '').toLowerCase()
  const mood = inferMoodLabel(lower)
  const fallbackGenres = unique([
    ...genres,
    ...(taste.preferredGenres || []).slice(0, 3).map((genre) => genre.toLowerCase()),
  ]).slice(0, 6)

  const searchQueries = unique([
    `${mood} ${fallbackGenres[0] || ''}`.trim(),
    `${mood} ${fallbackGenres[1] || ''}`.trim(),
    `${mood} airy vocals`.trim(),
    `${mood} late night`.trim(),
    `${mood} alternative`.trim(),
  ]).slice(0, 8)

  return {
    mood,
    genreHints: fallbackGenres,
    searchQueries,
    familiarRatio: 0.22,
  }
}

function applyMoodGuardrails(intent, rawQuery, explicitGenres) {
  const safeIntent = {
    mood: normalizePhrase(intent?.mood || rawQuery, 60),
    genreHints: unique(intent?.genreHints || []),
    searchQueries: unique(intent?.searchQueries || []),
    familiarRatio: clampNumber(intent?.familiarRatio, 0.15, 0.35, 0.22),
  }

  const profile = getMoodFamilyProfile(safeIntent.mood, rawQuery)
  if (!profile) return safeIntent

  const filteredQueries = safeIntent.searchQueries.filter(
    (query) => !(profile.blockedQueryTerms && profile.blockedQueryTerms.test(query)),
  )
  safeIntent.searchQueries = unique([...(profile.preferredQueries || []), ...filteredQueries]).slice(
    0,
    10,
  )

  const genreHints = unique([...(safeIntent.genreHints || []), ...(explicitGenres || [])])
    .map((genre) => genre.toLowerCase())
    .filter((genre) => !(profile.blockedGenres && profile.blockedGenres.test(genre)))

  safeIntent.genreHints = unique([...(profile.preferredGenreHints || []), ...genreHints]).slice(0, 6)

  if (typeof profile.familiarityCap === 'number') {
    safeIntent.familiarRatio = Math.min(safeIntent.familiarRatio, profile.familiarityCap)
  }

  return safeIntent
}

function getMoodFamilyProfile(mood, rawQuery) {
  const text = `${String(mood || '')} ${String(rawQuery || '')}`
  for (const profile of Object.values(MOOD_FAMILY_PROFILES)) {
    if (profile.matcher.test(text)) return profile
  }
  return null
}

function inferMoodLabel(lower) {
  if (/(sad|cry|heartbroken|breakup|grief|hurt|alone)/.test(lower)) return 'bittersweet late-night'
  if (/(calm|soothing|relax|rest|peace|gentle|tired|burnout|long day|after work)/.test(lower)) {
    return 'gentle decompression'
  }
  if (/(focus|study|locked in|productive|work mode)/.test(lower)) return 'clear-head focus'
  if (/(happy|sunny|fun|party|dance|hype|energetic)/.test(lower)) return 'bright dopamine'
  if (/(romantic|love|crush|date)/.test(lower)) return 'romantic glow'
  if (/(nostalgic|memory|miss|old)/.test(lower)) return 'soft nostalgia'
  if (/(night drive|night|midnight|late)/.test(lower)) return 'night-drive haze'
  return normalizePhrase(lower, 60) || 'soft late-night'
}

// -----------------------------
// PERSONALIZED TRACK SEARCH
// -----------------------------
async function getPersonalizedTracks({ token, rawQuery, genres, taste, intent, limit }) {
  const searchQueries = buildSearchQueries(rawQuery, genres, taste, intent)
  const profile = getMoodFamilyProfile(intent?.mood, rawQuery)

  const searchRequests = []
  for (const query of searchQueries) {
    for (const offset of [0, 50]) {
      searchRequests.push(
        spotifyFetchJson(
          `https://api.spotify.com/v1/search?${new URLSearchParams({
            q: query,
            type: 'track',
            limit: '50',
            offset: String(offset),
            ...(taste.market ? { market: taste.market } : {}),
          })}`,
          token,
        ).catch(() => ({ tracks: { items: [] } })),
      )
    }
  }

  const searchResponses = await Promise.all(searchRequests)

  const candidates = []
  const seenTrackIds = new Set()

  for (const response of searchResponses) {
    for (const track of response?.tracks?.items || []) {
      if (!track?.id || seenTrackIds.has(track.id)) continue
      seenTrackIds.add(track.id)
      candidates.push(track)
    }
  }

  const artistIds = [
    ...new Set(
      candidates
        .flatMap((track) => (track.artists || []).map((artist) => artist.id))
        .filter(Boolean),
    ),
  ]

  const artistDetails = await fetchArtistsById(token, artistIds)

  const filteredCandidates = profile?.strictFilter
    ? candidates.filter((track) => trackMatchesProfile(track, profile, artistDetails))
    : candidates

  const pool = filteredCandidates.length >= Math.max(12, Math.floor(limit * 1.6))
    ? filteredCandidates
    : candidates

  const scored = pool
    .map((track) => {
      const listenedBefore = taste.listenedTrackIds.has(track.id)
      const primaryArtistId = track.artists?.[0]?.id || null

      return {
        track,
        listenedBefore,
        primaryArtistId,
        score: scoreTrack(track, rawQuery, genres, taste, intent, artistDetails),
      }
    })
    .sort((a, b) => b.score - a.score)

  const targetFamiliarCount = Math.max(4, Math.round(limit * intent.familiarRatio))
  const targetDiscoveryCount = Math.max(limit - targetFamiliarCount, 1)

  const discovery = diversifyTracks(
    scored.filter((item) => !item.listenedBefore),
    targetDiscoveryCount,
  )
  const familiar = diversifyTracks(
    scored.filter((item) => item.listenedBefore),
    targetFamiliarCount,
  )

  const blended = []
  const finalSeen = new Set()

  function pushUnique(items) {
    for (const item of items) {
      if (!item?.track?.id || finalSeen.has(item.track.id)) continue
      finalSeen.add(item.track.id)
      blended.push(item)
      if (blended.length >= limit) break
    }
  }

  pushUnique(interleave(discovery, familiar))
  if (blended.length < limit) {
    pushUnique(scored)
  }

  return blended.slice(0, limit).map((item) => ({
    title: item.track.name,
    artist: (item.track.artists || []).map((artist) => artist.name).join(', '),
    image: item.track.album?.images?.[0]?.url || '',
    track_id: item.track.id,
    preview_url: item.track.preview_url || '',
    url: item.track.external_urls?.spotify || '',
    familiar: item.listenedBefore,
  }))
}

function buildSearchQueries(rawQuery, genres, taste, intent) {
  const explicitGenres = unique(genres.map((genre) => genre.toLowerCase()))
  const mood = normalizePhrase(intent.mood || rawQuery, 60)
  const profile = getMoodFamilyProfile(mood, rawQuery)
  const searchQueries = new Set()

  for (const query of intent.searchQueries || []) {
    if (query) searchQueries.add(query)
  }

  for (const genre of explicitGenres.slice(0, 3)) {
    searchQueries.add(`${mood} ${genre}`.trim())
  }

  for (const genre of (intent.genreHints || []).slice(0, 4)) {
    searchQueries.add(`${mood} ${genre}`.trim())
  }

  if (!profile?.avoidTasteBias) {
    const tasteGenres = (taste.preferredGenres || []).slice(0, 4)
    for (const genre of tasteGenres) {
      searchQueries.add(`${mood} ${genre}`.trim())
    }

    for (const artist of (taste.preferredArtistNames || []).slice(0, 4)) {
      searchQueries.add(`artist:"${artist}" ${mood}`)
      for (const genre of (intent.genreHints || []).slice(0, 2)) {
        searchQueries.add(`artist:"${artist}" ${genre}`)
      }
    }
  }

  searchQueries.add(`${mood} female vocals`)
  searchQueries.add(`${mood} atmospheric`)
  searchQueries.add(`${mood} emotional`)
  searchQueries.add(`${mood} alternative`)
  searchQueries.add(`${mood} indie`)

  return [...searchQueries]
    .map((query) => normalizePhrase(query, 100))
    .filter(Boolean)
    .slice(0, 10)
}

function scoreTrack(track, rawQuery, genres, taste, intent, artistDetails) {
  let score = 0

  const lowerRaw = String(rawQuery || '').toLowerCase()
  const lowerMood = String(intent.mood || rawQuery || '').toLowerCase()
  const lowerTitle = String(track.name || '').toLowerCase()
  const inputGenres = new Set([
    ...genres.map((genre) => genre.toLowerCase()),
    ...(intent.genreHints || []).map((genre) => genre.toLowerCase()),
  ])
  const preferredGenres = new Set((taste.preferredGenres || []).map((genre) => genre.toLowerCase()))
  const profile = getMoodFamilyProfile(lowerMood, lowerRaw)
  const listenedBefore = taste.listenedTrackIds.has(track.id)
  const savedBefore = taste.savedTrackIds.has(track.id)
  const artistWeightFactor = profile?.avoidTasteBias ? 0.2 : 1
  const topArtistFactor = profile?.avoidTasteBias ? 0.25 : 1
  const preferredGenreFactor = profile?.avoidTasteBias ? 0.25 : 1

  score += Math.min(track.popularity || 0, 80) * 0.14

  for (const artist of track.artists || []) {
    score += (taste.artistWeights.get(artist.id) || 0) * artistWeightFactor

    if (taste.topArtistIds.has(artist.id)) {
      score += 22 * topArtistFactor
    }

    const artistGenres = (artistDetails.get(artist.id)?.genres || []).map((genre) =>
      genre.toLowerCase(),
    )

    for (const genre of artistGenres) {
      if (inputGenres.has(genre)) score += 14
      if (preferredGenres.has(genre)) score += 5 * preferredGenreFactor
      if (lowerMood.includes(genre)) score += 8
      if (profile?.blockedGenres && profile.blockedGenres.test(genre)) score -= 20
    }
  }

  if (
    lowerTitle.includes('remix') ||
    lowerTitle.includes('sped up') ||
    lowerTitle.includes('nightcore')
  ) {
    score -= 12
  }

  if (profile?.titlePenalty && profile.titlePenalty.test(lowerTitle)) {
    score -= 32
  }

  if (profile?.titleBonus && profile.titleBonus.test(lowerTitle)) {
    score += 8
  }

  if (lowerMood.includes('focus') || lowerMood.includes('study') || lowerMood.includes('calm')) {
    if (lowerTitle.includes('instrumental') || lowerTitle.includes('ambient')) score += 7
  }

  if (lowerMood.includes('night') || lowerMood.includes('drive') || lowerRaw.includes('night')) {
    if (
      lowerTitle.includes('midnight') ||
      lowerTitle.includes('moon') ||
      lowerTitle.includes('night')
    ) {
      score += 3
    }
  }

  if (savedBefore) score += 8
  if (listenedBefore) score += profile?.avoidTasteBias ? 1 : 5

  return score
}

function trackMatchesProfile(track, profile, artistDetails) {
  if (!profile) return true

  const title = String(track?.name || '').toLowerCase()
  if (profile.titlePenalty && profile.titlePenalty.test(title)) {
    return false
  }

  if (!profile.blockedGenres) {
    return true
  }

  const artistGenres = (track?.artists || [])
    .flatMap((artist) => artistDetails.get(artist.id)?.genres || [])
    .map((genre) => String(genre || '').toLowerCase())

  const hasBlockedGenre = artistGenres.some((genre) => profile.blockedGenres.test(genre))
  return !hasBlockedGenre
}

// -----------------------------
// HELPERS
// -----------------------------
async function fetchArtistsById(token, artistIds) {
  const map = new Map()

  for (let index = 0; index < artistIds.length; index += 50) {
    const batch = artistIds.slice(index, index + 50)
    if (!batch.length) continue

    const response = await spotifyFetchJson(
      `https://api.spotify.com/v1/artists?${new URLSearchParams({
        ids: batch.join(','),
      })}`,
      token,
    )

    for (const artist of response.artists || []) {
      map.set(artist.id, artist)
    }
  }

  return map
}

async function spotifyFetchJson(url, token) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Spotify request failed (${response.status}): ${body}`)
  }

  return response.json()
}

function parseStructuredPayload(content) {
  if (typeof content === 'string') {
    return JSON.parse(content)
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part) => {
        if (typeof part === 'string') return part
        if (part?.type === 'text') return part.text || ''
        return ''
      })
      .join('')

    return JSON.parse(text)
  }

  throw new Error('Structured response was empty')
}

function bumpWeight(map, key, amount) {
  if (!key) return
  map.set(key, (map.get(key) || 0) + amount)
}

function rankByWeight(items) {
  return items.sort((a, b) => b.weight - a.weight)
}

function findArtistName(
  artistId,
  shortArtists,
  mediumArtists,
  shortTracks,
  mediumTracks,
  recentItems,
  savedItems,
) {
  const directArtist = [...shortArtists, ...mediumArtists].find((artist) => artist.id === artistId)
  if (directArtist?.name) return directArtist.name

  for (const track of [...shortTracks, ...mediumTracks]) {
    const artist = (track.artists || []).find((item) => item.id === artistId)
    if (artist?.name) return artist.name
  }

  for (const item of recentItems) {
    const artist = (item?.track?.artists || []).find((entry) => entry.id === artistId)
    if (artist?.name) return artist.name
  }

  for (const item of savedItems) {
    const artist = (item?.track?.artists || []).find((entry) => entry.id === artistId)
    if (artist?.name) return artist.name
  }

  return null
}

function diversifyTracks(items, limit) {
  const out = []
  const artistCounts = new Map()

  for (const item of items) {
    const primaryArtistId = item.primaryArtistId || 'unknown'
    const count = artistCounts.get(primaryArtistId) || 0

    if (count >= 3) continue

    artistCounts.set(primaryArtistId, count + 1)
    out.push(item)

    if (out.length >= limit) break
  }

  return out
}

function interleave(a, b) {
  const out = []
  const max = Math.max(a.length, b.length)

  for (let index = 0; index < max; index += 1) {
    if (a[index]) out.push(a[index])
    if (b[index]) out.push(b[index])
  }

  return out
}

function normalizePhrase(value, maxLength) {
  const text = String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^music for\s+/i, '')
    .replace(/^songs for\s+/i, '')
    .replace(/^playlist for\s+/i, '')

  return text.slice(0, maxLength)
}

function unique(items) {
  const out = []
  const seen = new Set()

  for (const item of items) {
    const value = String(item || '').trim()
    if (!value) continue
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(value)
  }

  return out
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value)
  if (Number.isNaN(num)) return fallback
  return Math.min(max, Math.max(min, num))
}

function generateState() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export default router
