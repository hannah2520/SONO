import express from 'express'
import Anthropic from '@anthropic-ai/sdk'
import process from 'process'
import fetch from 'node-fetch'

const router = express.Router()

let anthropic = null

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5'
const CLAUDE_TIMEOUT_MS = 20000
const SPOTIFY_TIMEOUT_MS = 12000
const MAX_SEARCH_QUERIES = 5

const SONO_RESPONSE_TOOL = {
  name: 'sono_chat_response',
  description: 'Return a structured mood-based music recommendation response',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      reply: { type: 'string' },
      mood: { type: 'string' },
      genres: { type: 'array', items: { type: 'string' } },
      queryLabel: { type: 'string' },
      searchQueries: { type: 'array', items: { type: 'string' } },
      energy: { type: 'string' },
      intent: { type: 'string' },
      discoveryPreference: { type: 'string' },
      responseType: { type: 'string' },
      needsClarification: { type: 'boolean' },
      clarificationQuestion: { type: 'string' },
      artistSeed: { type: 'array', items: { type: 'string' } },
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
}

function getAnthropicClient() {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is missing')
    }
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return anthropic
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
    if (!response.ok || !data?.access_token) return token

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
    const client = getAnthropicClient()
    const tasteSummary = spotifyToken ? await getSpotifyTasteSummary(spotifyToken) : null

    const systemPrompt = buildSystemPrompt(tasteSummary, chatContext)
    const userMessages = buildClaudeMessages(messages)

    const response = await withTimeout(
      client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        tools: [SONO_RESPONSE_TOOL],
        tool_choice: { type: 'tool', name: 'sono_chat_response' },
        messages: userMessages,
      }),
      CLAUDE_TIMEOUT_MS,
      'Claude request timed out',
    )

    const toolUseBlock = response.content.find((block) => block.type === 'tool_use')

    if (!toolUseBlock) {
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

    const parsed = toolUseBlock.input
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

function buildSystemPrompt(tasteSummary, chatContext) {
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
    'Query format examples: "emotional hip hop slow", "chill R&B late night female vocals", "sad rap introspective", "upbeat pop dance", "dreamy synth pop", "moody trap atmospheric", "soft R&B slow jam", "alternative indie melancholic".',
    'Avoid vague or aesthetic wording that does not help retrieval, such as "velvet melancholy", "soft-focus nostalgia", "golden hour longing", "emotional release", or "euphoria" when used alone.',
    'Do not return literal non-musical situation phrases unless the user explicitly asks for a specific artist, album, or song.',
    'Generate exactly 5 searchQueries.',
    'Make each query meaningfully different from the others — vary the genre, energy descriptor, and vocal/instrument focus.',
    'Do not generate near-duplicate search queries that only swap one or two words.',
    'CRITICAL RULE: When a Spotify taste summary is provided, you MUST ground your searchQueries in the user\'s actual genres and sounds. At least 3 of the 5 queries must directly use genres from the "current genres" or "overall genres" fields in the taste summary.',
    'Extract the user\'s primary genre from the taste summary (e.g. hip-hop, R&B, pop, rap, trap, country, reggaeton) and make it the backbone of your queries.',
    'Do NOT default to indie/folk/alternative unless those genres appear in the user\'s taste summary.',
    'If the user listens to hip-hop and R&B, your queries must reflect hip-hop and R&B sounds — not indie pop. If they listen to pop and dance, use pop and dance.',
    'You may still include 1-2 discovery queries slightly outside their usual genres, but the majority must match their actual taste.',
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

  return systemParts.join(' ')
}

function buildClaudeMessages(messages) {
  return messages.map((message) => ({
    role: message.role,
    content:
      typeof message.content === 'string' ? message.content : String(message.content || ''),
  }))
}

async function getSpotifyTasteSummary(token) {
  try {
    const [shortArtistsData, shortTracksData, medArtistsData, medTracksData, recentData, savedData] =
      await Promise.all([
        spotifyFetchJson(
          'https://api.spotify.com/v1/me/top/artists?limit=10&time_range=short_term',
          token,
        ),
        spotifyFetchJson(
          'https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=short_term',
          token,
        ),
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

    const shortArtists = shortArtistsData.items || []
    const shortTracks = shortTracksData.items || []
    const medArtists = medArtistsData.items || []
    const medTracks = medTracksData.items || []
    const recentItems = recentData.items || []
    const savedItems = savedData.items || []

    const recentGenres = rankByCount(shortArtists.flatMap((a) => a.genres || [])).slice(0, 5)
    const overallGenres = rankByCount(medArtists.flatMap((a) => a.genres || [])).slice(0, 5)

    const recentArtistNames = shortArtists.map((a) => a.name).filter(Boolean).slice(0, 6)
    const overallArtistNames = unique(
      medArtists.map((a) => a.name).filter(Boolean),
    ).filter((a) => !recentArtistNames.includes(a)).slice(0, 4)

    const recentTrackNames = shortTracks
      .map((t) => (t?.name && t?.artists?.[0]?.name ? `${t.name} by ${t.artists[0].name}` : null))
      .filter(Boolean)
      .slice(0, 4)

    const allTimeTrackNames = medTracks
      .map((t) => (t?.name && t?.artists?.[0]?.name ? `${t.name} by ${t.artists[0].name}` : null))
      .filter(Boolean)
      .slice(0, 3)

    const justPlayedArtists = unique(
      recentItems.flatMap((item) => item?.track?.artists || []).map((a) => a.name).filter(Boolean),
    ).filter((a) => !recentArtistNames.includes(a)).slice(0, 4)

    const savedArtists = unique(
      savedItems.flatMap((item) => item?.track?.artists || []).map((a) => a.name).filter(Boolean),
    ).slice(0, 4)

    return [
      recentArtistNames.length
        ? `CURRENT favorites (last 4 weeks) — artists: ${recentArtistNames.join(', ')}`
        : null,
      recentGenres.length ? `current genres: ${recentGenres.join(', ')}` : null,
      recentTrackNames.length ? `currently playing: ${recentTrackNames.join(' | ')}` : null,
      overallArtistNames.length ? `also listens to: ${overallArtistNames.join(', ')}` : null,
      overallGenres.length ? `overall genres: ${overallGenres.join(', ')}` : null,
      allTimeTrackNames.length ? `all-time tracks: ${allTimeTrackNames.join(' | ')}` : null,
      justPlayedArtists.length ? `just played: ${justPlayedArtists.join(', ')}` : null,
      savedArtists.length ? `saved artists: ${savedArtists.join(', ')}` : null,
    ]
      .filter(Boolean)
      .join(' || ')
  } catch (error) {
    console.error('Failed to build Spotify taste summary:', error)
    return null
  }
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
  const secondaryGenre = genres[1] || ''
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

  const genreBase = primaryGenre || 'pop'
  const genreBase2 = secondaryGenre || genreBase

  const candidates = [
    `${genreBase} ${energyModifier}`,
    intentModifier ? `${genreBase} ${intentModifier}`.trim() : `${genreBase} emotional`,
    gemsBias ? `${genreBase2} ${gemsBias}` : `${genreBase2} ${energyModifier}`,
    `${genreBase} melodic`,
    `${genreBase2} atmospheric`,
    `${genreBase} slow`,
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
    out.push(item)
  }

  return out
}

export default router
