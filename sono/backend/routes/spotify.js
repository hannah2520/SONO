import express from 'express'
import process from 'process'
import fetch from 'node-fetch'

const router = express.Router()

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

const SPOTIFY_REDIRECT_URI =
  process.env.VITE_SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:10000/api/auth/callback'

const APP_ORIGIN = process.env.APP_ORIGIN || 'http://127.0.0.1:5173'

// -----------------------------
// LOGIN → REDIRECT TO SPOTIFY
// -----------------------------
router.get('/login', (req, res) => {
  const state = generateState()
  req.session.spotifyState = state

  const scope = process.env.VITE_SPOTIFY_SCOPES || 'user-read-email user-read-private user-top-read'

  const authUrl = new URL('https://accounts.spotify.com/authorize')
  authUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID)
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('redirect_uri', SPOTIFY_REDIRECT_URI)
  authUrl.searchParams.append('scope', scope)
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

    // Fetch user profile
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const profile = await profileResponse.json()

    // Save to session
    req.session.spotifyToken = tokenData.access_token
    req.session.spotifyRefresh = tokenData.refresh_token
    req.session.profile = {
      id: profile.id,
      display_name: profile.display_name,
      email: profile.email,
    }

    // Redirect back to frontend
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
  // For your custom Map-based session, just wipe the data
  if (req.session) {
    req.session.spotifyToken = null
    req.session.spotifyRefresh = null
    req.session.profile = null
    req.session.spotifyState = null
  }

  res.json({ success: true })
})


// -----------------------------
// ✅ SPOTIFY SEARCH PROXY
// -----------------------------
router.get('/search', async (req, res) => {
  const token = req.session.spotifyToken
  const q = req.query.q

  if (!token) {
    return res.status(401).json({ error: 'Not connected to Spotify' })
  }

  if (!q) {
    return res.status(400).json({ error: 'Missing search query' })
  }

  try {
    const searchRes = await fetch(
      'https://api.spotify.com/v1/search?' +
        new URLSearchParams({
          q,
          type: 'track',
          limit: '50',
        }),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (!searchRes.ok) {
      const txt = await searchRes.text()
      console.error('Spotify search failed:', searchRes.status, txt)
      return res.status(searchRes.status).json({ error: 'Spotify search failed' })
    }

    const data = await searchRes.json()

    const tracks = (data.tracks?.items || []).map((track) => ({
      title: track.name,
      artist: track.artists.map((a) => a.name).join(', '),
      image: track.album.images[0]?.url,
      track_id: track.id,
    }))

    res.json({ tracks })
  } catch (err) {
    console.error('Error during Spotify search:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// -----------------------------
// HELPERS
// -----------------------------
function generateState() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export default router
