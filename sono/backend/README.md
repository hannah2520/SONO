# SONO Backend

Node.js/Express API server for the SONO music recommendation app.

## Setup

### Prerequisites

- Node.js 20.19.0+ or 22.12.0+
- npm or yarn

### Installation

```bash
cd backend
npm install
```

### Environment Variables

The backend uses the same `.env` file in the root directory. Ensure these are set:

```env
# Spotify API (required for auth)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/sono/callback

# OpenAI API (required for chat/recommendations)
OPENAI_API_KEY=your_openai_api_key

# Frontend origin (for CORS)
APP_ORIGIN=http://localhost:5173

# Server port
PORT=3000
```

## Running the Server

### Development (with auto-reload)

```bash
npm run dev
```

### Production

```bash
npm start
```

The server will start on `http://localhost:3000`.

## API Endpoints

### Authentication

#### `GET /api/auth/login`

Redirects to Spotify authorization page.

#### `GET /api/auth/callback`

Spotify OAuth callback (handled automatically).

#### `GET /api/auth/status`

Check authentication status.

**Response:**

```json
{
  "connected": true,
  "profile": {
    "id": "user_id",
    "display_name": "User Name",
    "email": "user@example.com"
  }
}
```

#### `POST /api/auth/logout`

Disconnect Spotify session.

### Chat & Recommendations

#### `POST /api/chat/stream`

Stream chat responses with mood detection.

**Request:**

```json
{
  "messages": [
    { "role": "user", "content": "I'm feeling happy today" },
    { "role": "assistant", "content": "Great! Happy vibes..." }
  ]
}
```

**Response:** Server-sent stream with mood/genre detection appended as JSON.

#### `GET /health`

Health check endpoint.

## How It Works

1. **Authentication Flow**
   - User clicks "Connect Spotify" → redirected to `/api/auth/login`
   - Spotify auth → callback to `/api/auth/callback`
   - Session stored in-memory (use Redis for production)

2. **Chat & Recommendations**
   - User sends a message → `/api/chat/stream` calls OpenAI GPT-4o-mini
   - AI responds with conversational text + mood/genre detection
   - Frontend extracts JSON payload for UI updates

## Development Notes

- **Session Storage**: Currently in-memory. For production, use Redis or database.
- **CORS**: Configured for localhost:5173 and https://hanniekwak.com
- **Spotify Redirect URI**: Must match exactly what's registered in Spotify Developer Dashboard

## Troubleshooting

### "No process on port 3000"

- Backend isn't running. Run `npm run dev` in the `backend/` directory.

### "CORS error"

- Check `APP_ORIGIN` and `SPOTIFY_REDIRECT_URI` in `.env`.
- Ensure Spotify app is configured with the correct redirect URI.

### "No access token received"

- Check `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are correct.
- Verify redirect URI exactly matches Spotify app settings.

### "Error: No access token"

- OpenAI API key (`OPENAI_API_KEY`) is missing or invalid.

## Next Steps

- Move session storage to Redis for multi-instance deployments
- Add request validation/rate limiting
- Implement actual Spotify track recommendations via Spotify API
- Add error logging/monitoring
