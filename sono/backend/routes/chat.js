import express from 'express'
import { OpenAI } from 'openai'
import process from 'process'

const router = express.Router()

// Lazy-load OpenAI client when first request comes in
let openai = null

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

// Stream chat with mood detection
router.post('/stream', async (req, res) => {
  const { messages } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages required' })
  }

  // System prompt for mood detection + recommendations
  const systemPrompt = `You are SONO, a music recommendation AI. Your job is to:
1. Understand the user's emotional state or music preference
2. Suggest specific music genres, moods, and track recommendations
3. Respond conversationally while detecting their current mood

At the end of your response, ALWAYS append a JSON block (on a new line) with this exact format:
<<<JSON:{"mood":"<detected mood>","genres":["<genre1>","<genre2>"],"tracks":[]}>>>

Examples of moods: Happy, Sad, Chill, Angry, Focus, Energetic, Romantic, Melancholic

Be conversational and friendly. Keep mood/genre suggestions relevant.`

  try {
    // Build messages for OpenAI
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ]

    // Stream response
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    let fullResponse = ''

    const client = getOpenAIClient()
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: openaiMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 500,
    })

    for await (const chunk of stream) {
      const delta = chunk.choices[0].delta
      if (delta.content) {
        const content = delta.content
        fullResponse += content
        res.write(content)
      }
    }

    // Append final JSON with mood detection
    const mood = extractMoodFromResponse(fullResponse)
    const genres = extractGenres(fullResponse)
    const jsonPayload = {
      mood,
      genres,
      tracks: [], // Could fetch from Spotify API if needed
    }

    res.write(`\n<<<JSON:${JSON.stringify(jsonPayload)}>>>`)
    res.end()
  } catch (error) {
    console.error('Chat stream error:', error)
    res.status(500).json({ error: error.message })
  }
})

function extractMoodFromResponse(text) {
  const moods = ['Happy', 'Sad', 'Chill', 'Angry', 'Focus', 'Energetic', 'Romantic', 'Melancholic']
  const lowerText = text.toLowerCase()

  for (const mood of moods) {
    if (lowerText.includes(mood.toLowerCase())) {
      return mood
    }
  }

  return 'Chill' // default
}

function extractGenres(text) {
  const genrePatterns = [
    'indie',
    'pop',
    'rock',
    'hip-hop',
    'jazz',
    'electronic',
    'synthwave',
    'folk',
    'soul',
    'r&b',
    'ambient',
    'classical',
    'lo-fi',
    'emo',
    'punk',
  ]
  const lowerText = text.toLowerCase()
  const found = new Set()

  for (const genre of genrePatterns) {
    if (lowerText.includes(genre)) {
      found.add(genre)
    }
  }

  return Array.from(found).slice(0, 3) // Return up to 3 genres
}

export default router
