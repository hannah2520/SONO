import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import process from 'process'

// Load env vars from parent directory (.env in root)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: `${__dirname}/../.env` })

// Import routes
import authRoutes from './routes/auth.js'
import chatRoutes from './routes/chat.js'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://hanniekwak.com'],
    credentials: true,
  }),
)
app.use(express.json())

// Session/cookie middleware (simple in-memory store for dev)
const sessions = new Map()
app.use((req, res, next) => {
  const sessionId = req.headers.cookie?.match(/sessionId=([^;]+)/)?.[1] || null
  req.session = sessionId ? sessions.get(sessionId) || {} : {}
  req.sessionId = sessionId || generateSessionId()
  next()
})

function generateSessionId() {
  return Math.random().toString(36).substring(2, 15)
}

// Set session cookie
app.use((req, res, next) => {
  const originalSend = res.send
  res.send = function (data) {
    if (req.sessionId && !res.getHeader('Set-Cookie')) {
      res.setHeader('Set-Cookie', `sessionId=${req.sessionId}; Path=/; HttpOnly`)
    }
    return originalSend.call(this, data)
  }
  next()
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🎵 SONO Backend running on http://localhost:${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})
