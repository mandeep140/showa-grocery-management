@echo off
title Showa Admin + Backend
cd /d "%~dp0"

echo ========================================
echo   Showa Admin + Backend — Starting (Dev)...
echo ========================================

echo Starting Backend on port 24034...
cd backend
start "Showa Backend" /min cmd /c "node server.js"
cd ..

timeout /t 2 /nobreak >nul
echo Backend started!

cd admin

echo.
echo Starting Admin on port 9824...
echo   Backend: http://localhost:24034
echo   Admin:   http://localhost:9824
echo.
echo Press Ctrl+C to stop Admin. Close the "Showa Backend" window to stop Backend.
echo.

start "" http://localhost:9824

call npm run dev
pause