# Deploying SONO to Production

This guide will help you deploy your SONO app so anyone can access it on the internet.

## Overview

You need to deploy TWO parts:
1. **Backend** → A Node.js hosting service
2. **Frontend** → A static hosting service

## Recommended Services

### For Backend (FREE options):
- ✅ **Render** (Easiest, recommended)
- Railway
- Heroku (requires credit card)
- Fly.io

### For Frontend (FREE):
- ✅ **Vercel** (Easiest, recommended)
- Netlify
- GitHub Pages (requires build setup)

---

## Part 1: Deploy Backend to Render

### Step 1: Sign Up
1. Go to https://render.com
2. Sign up with GitHub (easier for deployments)

### Step 2: Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `hannah2520/SONO`
3. Give it a name: `sono-backend`

### Step 3: Configure Settings
```
Build Command: npm install
Start Command: npm start
```

### Step 4: Add Environment Variables
Click "Advanced" → "Add Environment Variable" and add:

```
PORT=3000
OPENAI_API_KEY=your_openai_key_here
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=https://sono-backend.onrender.com/api/auth/callback
APP_ORIGIN=https://your-frontend-url.vercel.app
```

**Important**: 
- Replace `sono-backend` with your actual Render service name
- You'll update `APP_ORIGIN` after deploying the frontend

### Step 5: Deploy
Click "Create Web Service"

Wait 5-10 minutes for deployment. You'll get a URL like:
```
https://sono-backend.onrender.com
```

**⚠️ Save this URL - you'll need it for the frontend!**

### Step 6: Update Spotify Dashboard
1. Go to https://developer.spotify.com/dashboard
2. Open your SONO app settings
3. Add redirect URI: `https://sono-backend.onrender.com/api/auth/callback`
4. Save

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Sign Up
1. Go to https://vercel.com
2. Sign up with GitHub

### Step 2: Import Project
1. Click "Add New..." → "Project"
2. Import `hannah2520/SONO`
3. **Important**: Set "Root Directory" to `sono`

### Step 3: Configure Build Settings
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Step 4: Add Environment Variables
Click "Environment Variables" and add:

```
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=https://your-app.vercel.app/sono/callback
VITE_SPOTIFY_SCOPES=user-read-email user-read-private user-top-read
VITE_API_URL=https://sono-backend.onrender.com
```

**Important**:
- Replace `your-app` with your actual Vercel project name
- Replace `sono-backend` with your actual Render backend URL

### Step 5: Deploy
Click "Deploy"

Wait 2-3 minutes. You'll get a URL like:
```
https://your-app.vercel.app
```

Your app will be at: `https://your-app.vercel.app/sono/`

### Step 6: Update Spotify Dashboard Again
1. Go to https://developer.spotify.com/dashboard
2. Add redirect URI: `https://your-app.vercel.app/sono/callback`
3. Save

### Step 7: Update Backend Environment Variable
1. Go back to Render dashboard
2. Edit `APP_ORIGIN` environment variable to: `https://your-app.vercel.app`
3. Save (this will redeploy your backend)

---

## Testing Your Production Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app/sono/`
2. Test the chatbot
3. Try connecting to Spotify
4. Search for music

---

## Important Notes

### Render Free Tier Limitations
- Spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Upgrade to paid plan ($7/month) to keep it always running

### Environment Variables
- Never commit `.env` files to GitHub
- Always use the hosting platform's environment variable settings
- Frontend variables must start with `VITE_`

### Custom Domain (Optional)
Both Vercel and Render support custom domains:
- Buy a domain (Namecheap, Google Domains)
- Add it in your hosting platform settings
- Update all URLs accordingly

---

## Troubleshooting Production Issues

### "Failed to fetch" errors
- Check that `VITE_API_URL` matches your Render backend URL exactly
- Verify backend is running (visit the Render URL directly)
- Check browser console for CORS errors

### Spotify OAuth not working
- Verify all redirect URIs are added to Spotify Dashboard
- Check that `SPOTIFY_REDIRECT_URI` in backend matches exactly
- Ensure `VITE_SPOTIFY_REDIRECT_URI` in frontend matches exactly

### Backend crashes on Render
- Check Render logs for error messages
- Verify all environment variables are set correctly
- Ensure `npm start` works locally first

### Changes not showing up
- Frontend: Redeploy from Vercel dashboard
- Backend: Render auto-deploys from GitHub, or manually trigger

---

## Alternative Deployment Options

### Backend Alternatives

#### Railway
```
1. Sign up at railway.app
2. "New Project" → "Deploy from GitHub"
3. Select backend folder
4. Add environment variables
5. Deploy
```

#### Fly.io
```
1. Install flyctl CLI
2. Run: fly launch
3. Follow prompts
4. Deploy with: fly deploy
```

### Frontend Alternatives

#### Netlify
```
1. Sign up at netlify.com
2. "Add new site" → "Import from Git"
3. Set base directory to "sono"
4. Build command: npm run build
5. Publish directory: sono/dist
6. Add environment variables
7. Deploy
```

---

## Cost Breakdown

### Free (Recommended for Starting)
- Render Free Tier: Backend hosting
- Vercel Free Tier: Frontend hosting
- **Total: $0/month**

### Better Performance
- Render Starter: $7/month (no spin-down)
- Vercel Pro: $20/month (better bandwidth)
- **Total: $7-27/month**

---

## Next Steps After Deployment

1. **Test everything thoroughly**
2. **Set up monitoring** (Render and Vercel have built-in logs)
3. **Enable analytics** (optional - Google Analytics, Vercel Analytics)
4. **Share your app!** 🎉

Need help with deployment? Check the logs or let me know what error you're seeing!
