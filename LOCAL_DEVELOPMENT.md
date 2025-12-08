# Running SONO Locally - Quick Start Guide

## Prerequisites
- Node.js v18+ installed
- Terminal/Command Prompt access

## Step-by-Step: Running Both Servers

### Terminal 1: Start Backend Server

```bash
# Navigate to backend folder
cd backend

# Install dependencies (first time only)
npm install

# Start the backend server
npm run dev
```

**You should see:**
```
🚀 SONO chatbot API on http://127.0.0.1:3000
```

✅ Backend is now running! Keep this terminal window open.

---

### Terminal 2: Start Frontend Server

Open a **NEW terminal window** and run:

```bash
# Navigate to frontend folder
cd sono

# Install dependencies (first time only)
npm install

# Start the frontend server
npm run dev
```

**You should see:**
```
VITE v7.1.6  ready in XXX ms
➜  Local:   http://127.0.0.1:5173/sono/
```

✅ Frontend is now running! Keep this terminal window open too.

---

## Accessing Your App

Open your browser and go to:
```
http://127.0.0.1:5173/sono/
```

## Stopping the Servers

In each terminal window, press:
```
Ctrl + C
```

## Troubleshooting

### "Port already in use"
- Another instance is already running
- Stop it with `Ctrl + C` or restart your computer

### "Cannot find module"
- Run `npm install` in that folder

### "Fetch failed" or "Connection refused"
- Make sure BOTH servers are running
- Check that backend is on port 3000
- Check that frontend is on port 5173

### Changes not showing up?
- Save your files (Cmd/Ctrl + S)
- The servers auto-reload, but you may need to refresh your browser
