#!/bin/bash

# SONO Development Server Starter
# This script starts both backend and frontend servers

echo "🎵 Starting SONO Development Servers..."
echo ""

# Check if we're in the SONO directory
if [ ! -d "backend" ] || [ ! -d "sono" ]; then
    echo "❌ Error: Please run this script from the SONO root directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Node.js is installed
if ! command_exists node; then
    echo "❌ Error: Node.js is not installed"
    echo "   Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies if needed
echo "📦 Checking dependencies..."

if [ ! -d "backend/node_modules" ]; then
    echo "   Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "sono/node_modules" ]; then
    echo "   Installing frontend dependencies..."
    cd sono && npm install && cd ..
fi

echo "✅ Dependencies ready"
echo ""

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env not found"
    echo "   Copy backend/.env.example to backend/.env and add your credentials"
    echo ""
fi

if [ ! -f "sono/.env" ]; then
    echo "⚠️  Warning: sono/.env not found"
    echo "   Copy sono/.env.example to sono/.env and configure it"
    echo ""
fi

echo "🚀 Starting servers..."
echo ""
echo "Backend will run on: http://127.0.0.1:3000"
echo "Frontend will run on: http://127.0.0.1:5173/sono/"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers
# For macOS/Linux: use trap to kill child processes
trap 'kill $(jobs -p) 2>/dev/null' EXIT

# Start backend in background
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend in background
cd ../sono && npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
