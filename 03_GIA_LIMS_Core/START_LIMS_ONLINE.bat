@echo off
title HRGen GIA LIMS - Production Launcher
echo ========================================================
echo   Starting HRGen GIA LIMS & Cloudflare Zero-Trust Tunnel
echo ========================================================

cd /d "C:\Users\pc\Desktop\HRGEN GIA LIMS"

:: Check if server is already running on port 3001
netstat -ano | findstr :3001 >nul 2>&1
if %errorlevel% neq 0 (
    echo [1/2] Starting Node.js backend server...
    start /b node --env-file=.env server.js
    timeout /t 3 /nobreak >nul
) else (
    echo [1/2] Backend server is already running on port 3001.
)

:: Start Cloudflare tunnel
echo [2/2] Checking Cloudflare Tunnel...
tasklist /fi "imagename eq cloudflared.exe" | findstr /i "cloudflared.exe" >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting Cloudflare Tunnel...
    start "" "C:\Cloudflare\cloudflared.exe" tunnel --url http://127.0.0.1:3001
) else (
    echo Cloudflare tunnel is already active!
)

echo.
echo ========================================================
echo   LIMS PWA is LIVE and accessible online!
echo   Local:  http://localhost:3001
echo ========================================================
pause
