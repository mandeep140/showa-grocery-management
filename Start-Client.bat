@echo off
title Showa Client
cd /d "%~dp0"

echo ========================================
echo   Showa Client — Starting (Dev)...
echo ========================================

cd client

echo.
echo Starting Client on port 9823...
echo   Local:   http://localhost:9823
echo.
echo Press Ctrl+C to stop.
echo.

start "" https://localhost:9823

call npm run dev
pause