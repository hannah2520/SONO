import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import process from 'process'

// Load env vars from parent directory (.env in root)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: `${__dirname}/.env` })

// Debug: log key env values used by auth flow (non-secret)
console.log('Loaded env:', {
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID ? 'SET' : 'MISSING',
  VITE_SPOTIFY_REDIRECT_URI: process.env.VITE_SPOTIFY_REDIRECT_URI || null,
  APP_ORIGIN: process.env.APP_ORIGIN || null,
  PORT: process.env.PORT || null,
})

// Import routes after dotenv so environment variables are available to route modules
const { default: chatRoutes } = await import('./routes/chat.js')
const { default: spotifyRouter } = await import('./routes/spotify.js')

const app = express()
// const PORT = process.env.PORT || 3000

// Middleware
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://hanniekwak.com'],
    credentials: true,
  }),
)
app.use(express.json())

// Session/cookie middleware (simple in-memory store for dev/prod)
const sessions = new Map()

app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie || ''
  const match = cookieHeader.match(/sessionId=([^;]+)/)
  const existingId = match ? match[1] : null

  // Find or create session
  const sessionId = existingId || generateSessionId()
  const session = sessions.get(sessionId) || {}
  sessions.set(sessionId, session)

  req.sessionId = sessionId
  req.session = session

  // Build cookie value
  const isProd = process.env.NODE_ENV === 'production'
  let cookie = `sessionId=${sessionId}; Path=/; HttpOnly`

  // needed for cross-site (hanniekwak.com → sono-ct2p.onrender.com)
  if (isProd) {
    cookie += '; SameSite=None; Secure'
  }

  // Always send cookie, even on redirects
  res.setHeader('Set-Cookie', cookie)

  next()
})

function generateSessionId() {
  return Math.random().toString(36).substring(2, 15)
}

// Debug route to inspect env (non-secret)
app.get('/debug-env', (req, res) => {
  res.json({
    SPOTIFY_CLIENT_ID: !!process.env.SPOTIFY_CLIENT_ID,   // true/false only
    SPOTIFY_CLIENT_SECRET: !!process.env.SPOTIFY_CLIENT_SECRET, // true/false
    VITE_SPOTIFY_REDIRECT_URI: process.env.VITE_SPOTIFY_REDIRECT_URI || null,
    APP_ORIGIN: process.env.APP_ORIGIN || null,
    PORT: process.env.PORT || null,
  })
})

// Routes
app.use('/api/auth', spotifyRouter)
app.use('/api/chat', chatRoutes)
app.use('/api/spotify', spotifyRouter)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Start server
// app.listen(PORT, () => {
//   console.log(`🎵 SONO Backend running on http://localhost:${PORT}`)
//   console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
// })
const PORT = process.env.PORT || 10000

app.listen(PORT, () => {
  console.log(`🚀 SONO chatbot API listening on port ${PORT}`)
})
