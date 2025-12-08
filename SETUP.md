# SONO Setup Guide

This guide will help you set up the SONO application in any environment.

## Prerequisites

- Node.js v18 or higher
- npm or yarn
- Spotify Developer Account
- OpenAI API Account

## Setup Steps

### 1. Clone the Repository

```bash
git clone https://github.com/hannah2520/SONO.git
cd SONO
```

### 2. Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

#### Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your credentials:
   - `OPENAI_API_KEY`: Get from https://platform.openai.com/api-keys
   - `SPOTIFY_CLIENT_ID`: Get from https://developer.spotify.com/dashboard
   - `SPOTIFY_CLIENT_SECRET`: Get from https://developer.spotify.com/dashboard
   - `SPOTIFY_REDIRECT_URI`: Update if not using localhost:3000
   - `APP_ORIGIN`: Update to match your frontend URL

#### Spotify Developer Dashboard Configuration

1. Go to https://developer.spotify.com/dashboard
2. Create a new app or select your existing SONO app
3. Click "Edit Settings"
4. Add your Redirect URI (e.g., `http://localhost:3000/api/auth/callback`)
5. Save the settings

### 3. Frontend Setup

#### Install Dependencies

```bash
cd sono
npm install
```

#### Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and update:
   - `VITE_SPOTIFY_CLIENT_ID`: Same as backend
   - `VITE_SPOTIFY_REDIRECT_URI`: Must match frontend URL + `/sono/callback`
   - `VITE_API_URL`: Backend API URL (default: `http://localhost:3000`)

### 4. Running the Application

#### Start Backend Server

```bash
cd backend
npm run dev
```

The backend will run on http://localhost:3000

#### Start Frontend Server

```bash
cd sono
npm run dev
```

The frontend will run on http://localhost:5173/sono/

### 5. Access the Application

Open your browser and navigate to http://localhost:5173/sono/

## Troubleshooting

### Fetch Errors

If you get fetch errors like "Failed to fetch" or "Connection refused":

1. **Check Backend is Running**: Ensure the backend server is running on the correct port
2. **Verify API URL**: Check `VITE_API_URL` in `sono/.env` matches your backend URL
3. **CORS Issues**: Verify `APP_ORIGIN` in `backend/.env` matches your frontend URL
4. **Firewall**: Ensure your firewall isn't blocking local connections

### Spotify OAuth Errors

If you get "Invalid redirect URI" errors:

1. Check that `SPOTIFY_REDIRECT_URI` in `backend/.env` exactly matches the URI in your Spotify Dashboard
2. Ensure the redirect URI includes the correct protocol (http vs https)
3. Verify there are no trailing slashes

### Environment Variables Not Loading

If your environment variables aren't being recognized:

1. **Frontend**: Restart the Vite dev server after changing `.env`
2. **Backend**: The server should auto-reload with `npm run dev`
3. **Check Naming**: Frontend vars must start with `VITE_`
4. **No Quotes**: Don't wrap values in quotes in `.env` files

## Production Deployment

When deploying to production:

1. Update all URLs from `localhost` to your actual domains
2. Use `https` instead of `http`
3. Set secure environment variables in your hosting platform
4. Update Spotify Dashboard with production redirect URIs
5. Build the frontend: `npm run build`
6. Run backend in production mode: `npm start`

## Need Help?

Check the individual README files:
- Backend: `backend/README.md`
- Frontend: `sono/README.md`
