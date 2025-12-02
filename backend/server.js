// Minimal Express API that bridges OpenAI (mood → genres/features) with Spotify (tracks).
// Supports streaming chat + Spotify OAuth for personalized recommendations
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fetch from 'node-fetch';
import OpenAI from 'openai';

const app = express();
app.use(cors({ origin: process.env.APP_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// --- OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- In-memory caches
let spotifyTokenCache = { token: null, expiresAt: 0 };
let genreSeedsCache = { data: null, fetchedAt: 0 };

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: false
};

// ---------- Spotify App Token ----------
async function getSpotifyAppToken() {
  const now = Date.now();
  if (spotifyTokenCache.token && now < spotifyTokenCache.expiresAt) return spotifyTokenCache.token;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });

  if (!res.ok) throw new Error(`Spotify token error: ${res.status}`);
  
  const data = await res.json();
  spotifyTokenCache = {
    token: data.access_token,
    expiresAt: now + (data.expires_in - 60) * 1000
  };
  console.log('✓ Spotify app token obtained');
  return spotifyTokenCache.token;
}

// ---------- Spotify User Tokens (OAuth) ----------
function nowSec() { return Math.floor(Date.now() / 1000); }

async function exchangeCodeForTokens(code) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!res.ok) throw new Error(`Token exchange failed`);
  return res.json();
}

async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET
  });
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!res.ok) throw new Error(`Token refresh failed`);
  return res.json();
}

async function getUserAccessToken(req, res) {
  const access = req.cookies.sp_access;
  const expires = Number(req.cookies.sp_expires || 0);
  const refresh = req.cookies.sp_refresh;
  if (!refresh) return null;

  if (access && nowSec() < expires - 30) return access;

  try {
    const data = await refreshAccessToken(refresh);
    const newAccess = data.access_token;
    const expiresIn = data.expires_in || 3600;
    res?.cookie('sp_access', newAccess, { ...COOKIE_OPTS, maxAge: expiresIn * 1000 });
    res?.cookie('sp_expires', nowSec() + expiresIn, { ...COOKIE_OPTS, maxAge: expiresIn * 1000 });
    return newAccess;
  } catch {
    res?.clearCookie('sp_access');
    res?.clearCookie('sp_expires');
    res?.clearCookie('sp_refresh');
    return null;
  }
}

// --- Genre seeds ---
async function fetchGenreSeeds() {
  const now = Date.now();
  if (genreSeedsCache.data && now - genreSeedsCache.fetchedAt < 24 * 60 * 60 * 1000) {
    return genreSeedsCache.data;
  }
  
  const fallbackGenres = [
    'acoustic', 'afrobeat', 'alt-rock', 'alternative', 'ambient', 'blues', 'chill', 'classical', 
    'country', 'dance', 'disco', 'edm', 'electronic', 'folk', 'funk', 'gospel', 'grunge', 'guitar',
    'happy', 'hip-hop', 'house', 'indie', 'indie-pop', 'jazz', 'k-pop', 'latin', 'metal', 'pop',
    'punk', 'r-n-b', 'reggae', 'rock', 'sad', 'soul', 'study', 'techno', 'trance'
  ];
  
  try {
    const token = await getSpotifyAppToken();
    const res = await fetch('https://api.spotify.com/v1/recommendations/available-genre-seeds', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      console.warn(`Using fallback genres`);
      genreSeedsCache = { data: fallbackGenres, fetchedAt: now };
      return fallbackGenres;
    }
    const data = await res.json();
    genreSeedsCache = { data: data.genres || fallbackGenres, fetchedAt: now };
    return genreSeedsCache.data;
  } catch (error) {
    console.warn('Using fallback genres');
    genreSeedsCache = { data: fallbackGenres, fetchedAt: now };
    return fallbackGenres;
  }
}

function normalizeGenre(s) {
  return String(s || '').toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
}

function cleanGenres(rawGenres, seedSet) {
  const normalized = [...new Set((rawGenres || []).map(normalizeGenre))];
  const filtered = normalized.filter((g) => seedSet.has(g));
  return filtered.length ? filtered.slice(0, 3) : ['pop', 'indie', 'alternative'].filter((g) => seedSet.has(g)).slice(0, 3);
}

function moodToFeatures(mood = '') {
  const m = (mood || '').toLowerCase();
  if (m.includes('happy') || m.includes('excited') || m.includes('joy')) {
    return { target_valence: 0.85, target_energy: 0.75, target_danceability: 0.7, min_popularity: 40 };
  }
  if (m.includes('sad') || m.includes('down') || m.includes('blue')) {
    return { target_valence: 0.2, target_energy: 0.3, target_instrumentalness: 0.2, min_popularity: 30 };
  }
  if (m.includes('chill') || m.includes('calm') || m.includes('relax')) {
    return { target_valence: 0.6, target_energy: 0.35, target_acousticness: 0.4, target_danceability: 0.5, min_popularity: 30 };
  }
  if (m.includes('angry') || m.includes('mad') || m.includes('frustrated')) {
    return { target_energy: 0.9, target_valence: 0.25, min_popularity: 30 };
  }
  if (m.includes('focus') || m.includes('study') || m.includes('work')) {
    return { target_energy: 0.35, target_instrumentalness: 0.6, target_valence: 0.55, min_popularity: 20 };
  }
  return { target_valence: 0.55, target_energy: 0.55, min_popularity: 20 };
}

async function extractMoodGenres(messages) {
  const sys = `You are SONO's music mood expert.
Return ONLY JSON:
{"mood":"","genres":[],"artists_hint":[],"features":{"target_valence":0.0,"target_energy":0.0,"target_danceability":0.0},"reason":""}
- Genres must be Spotify seed genres (kebab-case).`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [{ role: 'system', content: sys }, ...messages.slice(-12)]
  });

  try {
    return JSON.parse(completion.choices?.[0]?.message?.content || '{}');
  } catch {
    const last = messages.filter((m) => m.role === 'user').slice(-1)[0]?.content || '';
    const mood = /sad|down|blue/i.test(last) ? 'sad' :
                 /happy|excited|joy/i.test(last) ? 'happy' :
                 /chill|calm|relax/i.test(last) ? 'chill' :
                 /angry|mad|frustrated/i.test(last) ? 'angry' : 'mixed';
    return { mood, genres: [], artists_hint: [], features: {}, reason: `Mood: ${mood}` };
  }
}

async function fetchUserTopArtists(token, limit = 3) {
  try {
    const url = `https://api.spotify.com/v1/me/top/artists?limit=${limit}&time_range=short_term`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return [];
    const j = await r.json();
    return (j.items || []).map((a) => a.id);
  } catch {
    return [];
  }
}

// ---------- OAuth routes ----------
app.get('/api/auth/login', (req, res) => {
  const state = Math.random().toString(36).slice(2);
  res.cookie('sp_state', state, { ...COOKIE_OPTS, maxAge: 10 * 60 * 1000 });
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: 'user-top-read',
    state
  });
  res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

app.get('/api/auth/callback', async (req, res) => {
  try {
    if (!req.query.code || req.query.state !== req.cookies.sp_state) throw new Error('Invalid auth state');
    res.clearCookie('sp_state', COOKIE_OPTS);
    const data = await exchangeCodeForTokens(req.query.code);
    const access = data.access_token;
    const refresh = data.refresh_token;
    const expiresIn = data.expires_in || 3600;

    res.cookie('sp_access', access, { ...COOKIE_OPTS, maxAge: expiresIn * 1000 });
    res.cookie('sp_expires', nowSec() + expiresIn, { ...COOKIE_OPTS, maxAge: expiresIn * 1000 });
    if (refresh) res.cookie('sp_refresh', refresh, { ...COOKIE_OPTS, maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.redirect(process.env.APP_ORIGIN + '/sono/#/chatbot');
  } catch (e) {
    res.status(400).send(`Auth failed: ${String(e?.message || e)}`);
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('sp_access');
  res.clearCookie('sp_expires');
  res.clearCookie('sp_refresh');
  res.json({ ok: true });
});

app.get('/api/auth/status', async (req, res) => {
  try {
    const token = await getUserAccessToken(req, res);
    if (!token) return res.json({ connected: false });
    const meRes = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${token}` } });
    if (!meRes.ok) return res.json({ connected: false });
    const me = await meRes.json();
    res.json({ connected: true, profile: { id: me.id, display_name: me.display_name, country: me.country } });
  } catch {
    res.json({ connected: false });
  }
});

// ---------- Chat (stream) ----------
const TAIL_BEGIN = '\n<<<JSON:';
const TAIL_END = '>>>\n';

app.post('/api/chat/stream', async (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');

    const sys = `You are SONO's friendly music guide. Be concise, empathetic, and conversational.`;
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.6,
      stream: true,
      messages: [{ role: 'system', content: sys }, ...messages.slice(-12)]
    });

    let fullText = '';
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || '';
      if (delta) {
        fullText += delta;
        res.write(delta);
      }
    }

    const userToken = await getUserAccessToken(req, res);
    const userMarket = userToken
      ? (await (await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${userToken}` } })).json()).country
      : undefined;
    const userTopArtistIds = userToken ? await fetchUserTopArtists(userToken, 3) : [];

    const ai = await extractMoodGenres([...messages, { role: 'assistant', content: fullText }]);
    const seedsArr = await fetchGenreSeeds();
    const genresClean = cleanGenres(ai.genres, new Set(seedsArr.map(normalizeGenre)));
    const features = Object.keys(ai.features || {}).length ? ai.features : moodToFeatures(ai.mood);

    const appToken = await getSpotifyAppToken();
    const params = new URLSearchParams();
    params.set('limit', '20');
    
    if (userTopArtistIds.length) {
      params.set('seed_artists', userTopArtistIds.join(','));
      if (genresClean.length) params.set('seed_genres', genresClean.slice(0, Math.max(0, 5 - userTopArtistIds.length)).join(','));
    } else {
      const genresToUse = genresClean.length > 0 ? genresClean.slice(0, 5) : ['pop'];
      params.set('seed_genres', genresToUse.join(','));
    }
    
    if (userMarket) params.set('market', userMarket);

    const whitelist = ['target_valence', 'target_energy', 'target_danceability', 'target_acousticness', 'target_instrumentalness', 'min_popularity'];
    for (const k of whitelist) {
      const v = features[k];
      if (typeof v === 'number' && !Number.isNaN(v)) params.set(k, String(v));
    }

    const recRes = await fetch(`https://api.spotify.com/v1/recommendations?${params.toString()}`, {
      headers: { Authorization: `Bearer ${appToken}` }
    });
    const rec = recRes.ok ? await recRes.json() : { tracks: [] };
    const tracks = (rec.tracks || []).map((t) => ({
      id: t.id,
      name: t.name,
      artists: (t.artists || []).map((a) => a.name).join(', '),
      url: t.external_urls?.spotify,
      preview_url: t.preview_url,
      image: t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || null
    }));

    const tail = JSON.stringify({ mood: ai.mood, genres: genresClean, features, tracks });
    res.write(TAIL_BEGIN + tail + TAIL_END);
    res.end();
  } catch (e) {
    try {
      res.write(`\n[error] ${String(e?.message || e)}\n`);
      res.end();
    } catch {}
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 SONO chatbot API on http://localhost:${PORT}`));
