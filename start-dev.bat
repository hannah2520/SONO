@echo off
REM SONO Development Server Starter for Windows
REM This script starts both backend and frontend servers

echo Starting SONO Development Servers...
echo.

REM Check if we're in the SONO directory
if not exist "backend" (
    echo Error: backend folder not found
    echo Please run this script from the SONO root directory
    pause
    exit /b 1
)

if not exist "sono" (
    echo Error: sono folder not found
    echo Please run this script from the SONO root directory
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

echo Checking dependencies...

REM Install dependencies if needed
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist "sono\node_modules" (
    echo Installing frontend dependencies...
    cd sono
    call npm install
    cd ..
)

echo Dependencies ready
echo.

REM Check if .env files exist
if not exist "backend\.env" (
    echo Warning: backend\.env not found
    echo Copy backend\.env.example to backend\.env and add your credentials
    echo.
)

if not exist "sono\.env" (
    echo Warning: sono\.env not found
    echo Copy sono\.env.example to sono\.env and configure it
    echo.
)

echo Starting servers...
echo.
echo Backend will run on: http://127.0.0.1:3000
echo Frontend will run on: http://127.0.0.1:5173/sono/
echo.
echo Press Ctrl+C to stop the servers
echo.

REM Start backend in new window
start "SONO Backend" cmd /k "cd backend && npm run dev"

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start frontend in new window
start "SONO Frontend" cmd /k "cd sono && npm run dev"

echo.
echo Both servers are starting in separate windows
echo Close those windows to stop the servers
echo.
pause
