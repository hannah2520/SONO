import express from 'express'
import { OpenAI } from 'openai'
import process from 'process'
import fetch from 'node-fetch'

const router = express.Router()

let openai = null

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini-2024-07-18'
const OPENAI_TIMEOUT_MS = 20000
const SPOTIFY_TIMEOUT_MS = 12000
const MAX_SEARCH_QUERIES = 5

function getOpenAIClient() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is missing')
    }

    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  return openai
}

async function getValidSpotifyToken(req) {
  const token = req.session?.spotifyToken
  if (!token) return null

  const expiresAt = req.session.spotifyTokenExpiresAt || 0
  if (Date.now() <= expiresAt - 60_000) return token

  const refreshToken = req.session.spotifyRefreshToken
  if (!refreshToken) return null

  try {
    const basicAuth = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID || ''}:${process.env.SPOTIFY_CLIENT_SECRET || ''}`,
    ).toString('base64')

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }).toString(),
    })

    const data = await response.json().catch(() => null)
    if (!response.ok || !data?.access_token) return token // fall back to old token

    req.session.spotifyToken = data.access_token
    req.session.spotifyTokenExpiresAt = Date.now() + Number(data.expires_in || 3600) * 1000
    if (data.refresh_token) req.session.spotifyRefreshToken = data.refresh_token

    return data.access_token
  } catch {
    return token
  }
}

router.post('/stream', async (req, res) => {
  const { messages, context, auth } = req.body
  const spotifyToken = await getValidSpotifyToken(req)
  const chatContext = normalizeChatContext(context, auth)

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages required' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const client = getOpenAIClient()
    const tasteSummary = spotifyToken ? await getSpotifyTasteSummary(spotifyToken) : null

    const completion = await withTimeout(
      client.chat.completions.create({
        model: OPENAI_MODEL,
        temperature: 0.8,
        max_completion_tokens: 700,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'sono_chat_response',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                reply: { type: 'string' },
                mood: { type: 'string' },
                genres: {
                  type: 'array',
                  items: { type: 'string' },
                  maxItems: 6,
                },
                queryLabel: { type: 'string' },
                searchQueries: {
                  type: 'array',
                  items: { type: 'string' },
                  maxItems: 8,
                },
                energy: { type: 'string' },
                intent: { type: 'string' },
                discoveryPreference: { type: 'string' },
                responseType: { type: 'string' },
                needsClarification: { type: 'boolean' },
                clarificationQuestion: { type: 'string' },
                artistSeed: {
                  type: 'array',
                  items: { type: 'string' },
                  maxItems: 3,
                },
              },
              required: [
                'reply',
                'mood',
                'genres',
                'queryLabel',
                'searchQueries',
                'energy',
                'intent',
                'discoveryPreference',
                'responseType',
                'needsClarification',
                'clarificationQuestion',
                'artistSeed',
              ],
            },
          },
        },
        messages: buildOpenAIMessages(messages, tasteSummary, chatContext),
      }),
      OPENAI_TIMEOUT_MS,
      'OpenAI request timed out',
    )

    const message = completion.choices?.[0]?.message
    const refusal = message?.refusal

    if (refusal) {
      const safeReply =
        'I can help with music moods and recommendations, but I could not answer that request.'

      await writeTextResponse(res, safeReply)
      res.write(
        `\n<<<JSON:${JSON.stringify({
          mood: 'late night calm',
          genres: [],
          tracks: [],
          queryLabel: 'late night calm',
          searchQueries: ['melodic indie pop', 'moody alternative r&b'],
          energy: 'medium',
          intent: 'match',
          discoveryPreference: 'mixed',
          responseType: 'recommendation',
          needsClarification: false,
          clarificationQuestion: '',
        })}>>>`,
      )
      return res.end()
    }

    const parsed = parseStructuredPayload(message?.content)
    const payload = normalizePayload(parsed, chatContext)

    await writeTextResponse(res, payload.reply)

    res.write(
      `\n<<<JSON:${JSON.stringify({
        mood: payload.mood,
        genres: payload.genres,
        tracks: [],
        queryLabel: payload.queryLabel,
        searchQueries: payload.searchQueries,
        energy: payload.energy,
        intent: payload.intent,
        discoveryPreference: payload.discoveryPreference,
        responseType: payload.responseType,
        needsClarification: payload.needsClarification,
        clarificationQuestion: payload.clarificationQuestion,
        artistSeed: payload.artistSeed,
      })}>>>`,
    )
    res.end()
  } catch (error) {
    console.error('Chat stream error:', error)

    if (!res.headersSent) {
      return res.status(500).json({ error: error.message || 'Chat request failed' })
    }

    res.write(
      `\n<<<JSON:${JSON.stringify({
        mood: 'late night calm',
        genres: [],
        tracks: [],
        queryLabel: 'late night calm',
        searchQueries: ['melodic indie pop', 'moody alternative r&b'],
        energy: 'medium',
        intent: 'match',
        discoveryPreference: 'mixed',
        responseType: 'recommendation',
        needsClarification: false,
        clarificationQuestion: '',
        error: error.message || 'Chat request failed',
      })}>>>`,
    )
    res.end()
  }
})

function buildOpenAIMessages(messages, tasteSummary, chatContext) {
  const systemParts = [
    'You are SONO, a mood-based music discovery AI.',
    'Your job is to understand the user emotionally and turn what they say into strong music retrieval queries.',
    'SONO is emotion-first and music-search-first.',
    'Do not mirror the user input back as a literal search phrase.',
    'If the user describes a life situation, infer the underlying emotional state and translate it into music-friendly language.',
    'Prioritize emotional accuracy over poetic wording.',
    'The mood should be a short, clear emotional label, usually 1-3 words.',
    'Good mood examples: "quiet focus", "late night calm", "sad reflection", "warm comfort", "restless energy", "heavy release".',
    'Bad mood examples: "music for going to class", "songs for after work", "wistful night drive", "restless glitter", "romantic golden-hour".',
    'The queryLabel should be short, simple, and useful for display.',
    'The searchQueries are the most important part and must be optimized for good music results.',
    'Each search query should be a musically searchable phrase, not a poetic phrase.',
    'Build searchQueries using combinations of genre, energy, tempo, vocals, instrumentation, and emotional tone.',
    'Prefer phrases like "sad indie pop female vocals", "chill alternative r&b slow", "soft acoustic indie folk", "upbeat dance pop", "dreamy synth pop", "moody electronic late night".',
    'Avoid vague or aesthetic wording that does not help retrieval, such as "velvet melancholy", "soft-focus nostalgia", "golden hour longing", "emotional release", or "euphoria" when used alone.',
    'Do not return literal non-musical situation phrases unless the user explicitly asks for a specific artist, album, or song.',
    'Generate exactly 5 searchQueries.',
    'Make each query meaningfully different from the others.',
    'Do not generate near-duplicate search queries that only swap one or two words.',
    'When a Spotify taste summary is provided, bias the searchQueries toward genres, artists, sounds, and eras the user already likes.',
    'Use the taste profile to make results feel personal, with a mix of familiar-adjacent music and discovery.',
    'Favor emotionally compatible and taste-compatible music over generic mood playlists.',
    'Write a warm, natural, concise reply in reply.',
    'The reply should show emotional understanding of the user, but should not be overly poetic or abstract.',
    'Do not put JSON fences or markdown in reply.',
    'You must return these fields: reply, mood, genres, queryLabel, searchQueries, energy, intent, discoveryPreference, responseType, needsClarification, clarificationQuestion.',
    'Set responseType to either "clarification" or "recommendation" only.',
    'If emotional context is weak or conflicting, ask exactly one clear follow-up question, set responseType="clarification", needsClarification=true, and keep clarificationQuestion non-empty.',
    'If context is sufficient, set responseType="recommendation", needsClarification=false, and clarificationQuestion="".',
    'Respect user intent values like match, shift, discover, focus, regulate.',
    'Respect discoveryPreference values like familiar, mixed, hidden_gems when forming searchQueries.',
    'When discoveryPreference is hidden_gems, avoid obvious mainstream-only phrasing.',
    'If the user explicitly names a specific artist (e.g. "songs like K Camp", "similar to Drake"), add that artist name to artistSeed. Otherwise artistSeed must be an empty array.',
    'artistSeed should only contain real, well-known artist names the user literally mentioned — never invent artist names.',
  ]

  if (tasteSummary) {
    systemParts.push(`User Spotify taste summary: ${tasteSummary}`)
  }

  if (chatContext) {
    const contextSummary = [
      `mood=${chatContext.mood || 'unknown'}`,
      `energy=${chatContext.energy || 'unknown'}`,
      `intent=${chatContext.intent || 'unknown'}`,
      `discoveryPreference=${chatContext.discoveryPreference || 'mixed'}`,
      `genres=${(chatContext.genres || []).join(', ') || 'none'}`,
      `lastFeedback=${chatContext.lastFeedback || 'none'}`,
      `authConnected=${chatContext.authConnected ? 'yes' : 'no'}`,
    ].join(' | ')

    systemParts.push(`Structured frontend context: ${contextSummary}`)
  }

  return [
    {
      role: 'system',
      content: systemParts.join(' '),
    },
    ...messages.map((message) => ({
      role: message.role,
      content:
        typeof message.content === 'string' ? message.content : String(message.content || ''),
    })),
  ]
}

async function getSpotifyTasteSummary(token) {
  try {
    const [topArtistsData, topTracksData, recentData, savedData] = await Promise.all([
      spotifyFetchJson(
        'https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term',
        token,
      ),
      spotifyFetchJson(
        'https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=medium_term',
        token,
      ),
      spotifyFetchJson('https://api.spotify.com/v1/me/player/recently-played?limit=10', token),
      spotifyFetchJson('https://api.spotify.com/v1/me/tracks?limit=10', token),
    ])

    const topArtists = topArtistsData.items || []
    const topTracks = topTracksData.items || []
    const recentItems = recentData.items || []
    const savedItems = savedData.items || []

    const genres = rankByCount(topArtists.flatMap((artist) => artist.genres || [])).slice(0, 6)
    const artists = topArtists
      .map((artist) => artist.name)
      .filter(Boolean)
      .slice(0, 6)
    const tracks = topTracks
      .map((track) =>
        track?.name && track?.artists?.[0]?.name
          ? `${track.name} by ${track.artists[0].name}`
          : track?.name || null,
      )
      .filter(Boolean)
      .slice(0, 5)
    const recentArtists = unique(
      recentItems
        .flatMap((item) => item?.track?.artists || [])
        .map((artist) => artist.name)
        .filter(Boolean),
    ).slice(0, 5)
    const savedArtists = unique(
      savedItems
        .flatMap((item) => item?.track?.artists || [])
        .map((artist) => artist.name)
        .filter(Boolean),
    ).slice(0, 5)

    return [
      artists.length ? `top artists: ${artists.join(', ')}` : null,
      genres.length ? `top genres: ${genres.join(', ')}` : null,
      tracks.length ? `top tracks: ${tracks.join(', ')}` : null,
      recentArtists.length ? `recent artists: ${recentArtists.join(', ')}` : null,
      savedArtists.length ? `saved artists: ${savedArtists.join(', ')}` : null,
    ]
      .filter(Boolean)
      .join(' | ')
  } catch (error) {
    console.error('Failed to build Spotify taste summary:', error)
    return null
  }
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

function normalizePayload(payload, chatContext = null) {
  const safeMood = normalizeMood(payload?.mood || chatContext?.mood)
  const safeGenres = Array.isArray(payload?.genres)
    ? unique(
        payload.genres
          .map((genre) => String(genre).trim())
          .filter(Boolean),
      ).slice(0, 6)
    : Array.isArray(chatContext?.genres)
      ? unique(
          chatContext.genres
            .map((genre) => String(genre).trim())
            .filter(Boolean),
        ).slice(0, 6)
      : []
  const safeReply =
    String(payload?.reply || '').trim() ||
    "I have a vibe in mind for you — let's find something that feels right."
  const safeQueryLabel = normalizeMood(payload?.queryLabel || safeMood)
  const safeEnergy = normalizeEnergy(payload?.energy || chatContext?.energy)
  const safeIntent = normalizeIntent(payload?.intent || chatContext?.intent)
  const safeDiscoveryPreference = normalizeDiscoveryPreference(
    payload?.discoveryPreference || chatContext?.discoveryPreference,
  )
  const responseType = normalizeResponseType(payload?.responseType)
  const needsClarification = Boolean(payload?.needsClarification) || responseType === 'clarification'
  const clarificationQuestion = needsClarification
    ? normalizeClarificationQuestion(payload?.clarificationQuestion)
    : ''

  const rawSearchQueries = Array.isArray(payload?.searchQueries)
    ? payload.searchQueries
        .map((item) => normalizeSearchPhrase(item))
        .filter(Boolean)
    : []

  const filteredQueries = rawSearchQueries.filter((query) => !isBadStandaloneSearchPhrase(query))
  const dedupedQueries = unique(filteredQueries)
  const diversifiedQueries = diversifySearchQueries(dedupedQueries)

  const fallbackQueries = buildFallbackSearchQueries(safeMood, safeGenres, {
    energy: safeEnergy,
    intent: safeIntent,
    discoveryPreference: safeDiscoveryPreference,
  })
  const searchQueries = unique([...diversifiedQueries, ...fallbackQueries]).slice(0, MAX_SEARCH_QUERIES)

  const artistSeed = Array.isArray(payload?.artistSeed)
    ? unique(payload.artistSeed.map((a) => String(a || '').trim()).filter(Boolean)).slice(0, 3)
    : []

  return {
    reply: safeReply,
    mood: safeMood,
    genres: safeGenres,
    queryLabel: safeQueryLabel,
    searchQueries,
    energy: safeEnergy,
    intent: safeIntent,
    discoveryPreference: safeDiscoveryPreference,
    responseType,
    needsClarification,
    clarificationQuestion,
    artistSeed,
  }
}

function normalizeOptionalMood(value) {
  const text = String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^music for\s+/i, '')
    .replace(/^songs for\s+/i, '')
    .replace(/^playlist for\s+/i, '')
    .replace(/^vibes? for\s+/i, '')

  if (!text) return ''

  return normalizeMood(text)
}

function normalizeMood(value) {
  const text = String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^music for\s+/i, '')
    .replace(/^songs for\s+/i, '')
    .replace(/^playlist for\s+/i, '')
    .replace(/^vibes? for\s+/i, '')

  if (!text) return 'late night calm'

  const trimmed = text.split(/[.!?]/)[0].trim()
  return trimmed.slice(0, 60)
}

function normalizeSearchPhrase(value) {
  const text = String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^music for\s+/i, '')
    .replace(/^songs for\s+/i, '')
    .replace(/^playlist for\s+/i, '')
    .replace(/^vibes? for\s+/i, '')
    .replace(/["'`]+/g, '')

  if (!text) return ''

  return text.slice(0, 80)
}

function normalizeEnergy(value) {
  const text = normalizeText(value)

  if (!text) return 'medium'
  if (['low', 'calm', 'soft'].includes(text)) return 'low'
  if (['high', 'intense', 'hype'].includes(text)) return 'high'
  if (['steady', 'focused'].includes(text)) return 'steady'
  return 'medium'
}

function normalizeIntent(value) {
  const text = normalizeText(value)
  const allowed = new Set(['match', 'shift', 'discover', 'focus', 'regulate'])
  if (allowed.has(text)) return text
  return 'match'
}

function normalizeDiscoveryPreference(value) {
  const text = normalizeText(value)
  const allowed = new Set(['familiar', 'mixed', 'hidden_gems'])
  if (allowed.has(text)) return text
  if (text === 'hidden gems') return 'hidden_gems'
  return 'mixed'
}

function normalizeResponseType(value) {
  const text = normalizeText(value)
  return text === 'clarification' ? 'clarification' : 'recommendation'
}

function normalizeClarificationQuestion(value) {
  const text = String(value || '').trim().replace(/\s+/g, ' ')

  if (text) {
    return text.slice(0, 180)
  }

  return 'Do you want something familiar and comforting, or more discovery-focused and new?'
}

function normalizeChatContext(rawContext, rawAuth) {
  const context = rawContext && typeof rawContext === 'object' ? rawContext : {}
  const auth = rawAuth && typeof rawAuth === 'object' ? rawAuth : {}

  const genres = Array.isArray(context.genres)
    ? unique(context.genres.map((genre) => String(genre || '').trim()).filter(Boolean)).slice(0, 6)
    : []

  return {
    mood: normalizeOptionalMood(context.mood),
    energy: normalizeEnergy(context.energy),
    intent: normalizeIntent(context.intent),
    discoveryPreference: normalizeDiscoveryPreference(context.discoveryPreference),
    genres,
    lastFeedback: String(context.lastFeedback || '').trim().slice(0, 220),
    authConnected: Boolean(auth.connected),
    authName: String(auth.name || '').trim().slice(0, 80),
  }
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\w\s&/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isBadStandaloneSearchPhrase(query) {
  const q = normalizeText(query)

  if (!q) return true

  const bannedExact = new Set([
    'emotional release',
    'healing',
    'sadness',
    'euphoria',
    'nostalgia',
    'melancholy',
    'wistful',
    'soft focus nostalgia',
    'golden hour longing',
    'restless glitter',
    'burnout haze',
  ])

  if (bannedExact.has(q)) return true

  const bannedFragments = [
    'music for',
    'songs for',
    'after work',
    'going to class',
    'long day of work',
    'golden hour',
    'soft focus',
    'velvet melancholy',
    'restless glitter',
    'night drive',
  ]

  return bannedFragments.some((fragment) => q.includes(fragment))
}

function queryTokens(query) {
  return normalizeText(query).split(' ').filter(Boolean)
}

function areQueriesTooSimilar(a, b) {
  const aTokens = queryTokens(a)
  const bTokens = queryTokens(b)

  if (!aTokens.length || !bTokens.length) return false

  const aSet = new Set(aTokens)
  const bSet = new Set(bTokens)

  let overlap = 0
  for (const token of aSet) {
    if (bSet.has(token)) overlap += 1
  }

  const minSize = Math.min(aSet.size, bSet.size)
  return overlap >= Math.max(2, minSize - 1)
}

function diversifySearchQueries(queries) {
  const diversified = []

  for (const query of queries) {
    if (diversified.some((existing) => areQueriesTooSimilar(existing, query))) {
      continue
    }

    diversified.push(query)

    if (diversified.length >= MAX_SEARCH_QUERIES) {
      break
    }
  }

  return diversified
}

function buildFallbackSearchQueries(mood, genres, options = {}) {
  const { energy = 'medium', intent = 'match', discoveryPreference = 'mixed' } = options
  const primaryGenre = genres[0] || ''
  const gemsBias = discoveryPreference === 'hidden_gems' ? 'hidden gems' : ''
  const intentModifier =
    intent === 'shift'
      ? 'mood lift'
      : intent === 'focus'
        ? 'focus'
        : intent === 'regulate'
          ? 'calm'
          : intent === 'discover'
            ? 'discovery'
            : ''
  const energyModifier = energy === 'high' ? 'high energy' : energy === 'low' ? 'soft' : 'steady'

  const candidates = [
    primaryGenre ? `${primaryGenre} ${energyModifier}` : `indie pop ${energyModifier}`,
    primaryGenre ? `${primaryGenre} ${intentModifier}`.trim() : `alternative ${intentModifier}`.trim(),
    gemsBias ? `${primaryGenre || 'indie'} ${gemsBias}` : '',
    `melodic indie pop`,
    `moody alternative r&b`,
    `soft indie folk`,
    `dreamy synth pop`,
    `emotional alternative`,
  ]

  return unique(
    candidates
      .map((item) => normalizeSearchPhrase(item))
      .filter(Boolean)
      .filter((query) => !isBadStandaloneSearchPhrase(query)),
  ).slice(0, MAX_SEARCH_QUERIES)
}

async function writeTextResponse(res, text) {
  const chunks = text.match(/.{1,24}(\s|$)/g) || [text]

  for (const chunk of chunks) {
    res.write(chunk)
    await delay(12)
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function spotifyFetchJson(url, token) {
  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    SPOTIFY_TIMEOUT_MS,
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Spotify request failed (${response.status}): ${body}`)
  }

  return response.json()
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function withTimeout(promise, timeoutMs, errorMessage = 'Request timed out') {
  let timeoutId

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeoutId)
  }
}

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
    const lower = key.toLowerCase()
    if (seen.has(lower)) continue
    seen.add(lower)
    out.push(key)
  }

  return out
}

export default router
