@echo off
REM JARVIS API Windows Startup Script

echo ===================================
echo  JARVIS API - Windows Startup
echo ===================================

REM Set environment variables
set NODE_ENV=development
set PORT=3002

REM Create logs directory if it doesn't exist
if not exist logs mkdir logs

echo Starting JARVIS API on port %PORT%...
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
node index.js

pause 