import express from 'express'
import process from 'process'

const router = express.Router()

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const SPOTIFY_REDIRECT_URI =
  process.env.VITE_SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:10000/api/auth/callback'
const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173'

// Session storage (in-memory for dev; use Redis in production)

// Login: redirect to Spotify auth
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

// Callback: exchange code for token
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
      throw new Error('No access token received')
    }

    // Fetch user profile
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profile = await profileResponse.json()

    // Store in session
    req.session.spotifyToken = tokenData.access_token
    req.session.spotifyRefresh = tokenData.refresh_token
    req.session.profile = {
      id: profile.id,
      display_name: profile.display_name,
      email: profile.email,
    }

    // Redirect back to frontend
    res.redirect(`${APP_ORIGIN}/sono?auth=success`)
  } catch (error) {
    console.error('Auth callback error:', error)
    res.redirect(`${APP_ORIGIN}/sono?auth=error`)
  }
})

// Status: check auth
router.get('/status', (req, res) => {
  const connected = !!req.session.spotifyToken
  res.json({
    connected,
    profile: connected ? req.session.profile : null,
  })
})

// Logout
router.post('/logout', (req, res) => {
  req.session = {}
  res.json({ success: true })
})

function generateState() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export default router
