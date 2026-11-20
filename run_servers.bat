@echo off
title Lux CRM Launcher
echo ====================================================
echo Starting Lux CRM Backend and Frontend Servers
echo ====================================================

:: Automatically clear any lingering zombie processes on ports 8005 and 5173
echo Checking and freeing ports 8005 and 5173...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0free_ports.ps1" >nul 2>&1

timeout /t 1 /nobreak >nul

start "Lux Backend (Port 8005)" /D "%~dp0backend" cmd /k "python -m uvicorn app.main:app --host 127.0.0.1 --port 8005"
start "Lux Frontend (Port 5173)" /D "%~dp0frontend" cmd /k "npm run dev"

echo.
echo Both servers are launching in separate windows:
echo - Backend:  http://127.0.0.1:8005
echo - Frontend: http://localhost:5173
echo ====================================================
pause
