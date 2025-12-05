# SONO Backend Server

Backend API server for the SONO application with OpenAI and Spotify integration for mood-based music recommendations.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment variables:
   - Open `.env` file
   - Add your API keys:
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `SPOTIFY_CLIENT_ID`: Your Spotify Client ID
     - `SPOTIFY_CLIENT_SECRET`: Your Spotify Client Secret

## Getting Spotify Credentials

1. Go to https://developer.spotify.com/dashboard
2. Log in with your Spotify account
3. Create a new app
4. Copy your Client ID and Client Secret

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:3000`

## API Endpoints

### Health Check
- **GET** `/api/health`
- Returns server status

### Chat with AI (Mood-based Music Recommendations)
- **POST** `/api/chat`
- Body:
  ```json
  {
    "messages": [
      { "role": "user", "content": "I'm feeling happy" },
      { "role": "assistant", "content": "..." }
    ]
  }
  ```
- Returns:
  - AI response with mood analysis
  - Genre recommendations
  - Track recommendations from Spotify
  - Audio features

## How It Works

1. User sends a mood/feeling message
2. OpenAI analyzes the mood and suggests genres/audio features
3. Backend queries Spotify for matching tracks
4. Returns curated music recommendations with preview links

