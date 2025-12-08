# SONO Backend Setup Guide

## Quick Start (First Time Only)

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Verify your `.env` file has all required vars

From the root directory, check `.env`:

```bash
cat .env
```

Make sure these are set:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `OPENAI_API_KEY`
- `VITE_SPOTIFY_REDIRECT_URI`
- `PORT=3000`

### 3. Start the backend

You have two options:

**Option A: Run backend separately (recommended for development)**

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run dev:backend
```

**Option B: Run both together (requires `concurrently`)**

```bash
npm install -D concurrently
npm run dev:full
```

## How to Know It's Working

1. **Backend health check:**

   ```bash
   curl http://localhost:3000/health
   ```

   Should return: `{"status":"ok"}`

2. **Try the chatbot:**
   - Open http://localhost:5173
   - Go to ChatBot page
   - Type a message like "I'm feeling happy"
   - Should stream a response with mood detection

3. **Check console logs:**
   - Backend terminal should show: `🎵 SONO Backend running on http://localhost:3000`
   - No error messages = good!

## Troubleshooting

### "Connection refused on port 3000"

- Is the backend running? Check the terminal where you ran `npm run dev:backend`
- Is the port already in use? Try: `lsof -i :3000`

### "CORS error in browser console"

- The backend and frontend need to trust each other
- Check that `APP_ORIGIN=http://localhost:5173` is in `.env`

### "401 Unauthorized from OpenAI"

- Your `OPENAI_API_KEY` is wrong or expired
- Check it in `.env`

### "Error: No Spotify token"

- Did you click "Connect Spotify"?
- Is your `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` correct?

## Next Time You Work On This

Just run (in separate terminals):

```bash
npm run dev          # Frontend
npm run dev:backend  # Backend
```

That's it! 🎵
