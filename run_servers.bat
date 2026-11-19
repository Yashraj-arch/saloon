@echo off
title LuxeSalon CRM Launcher
echo ====================================================
echo Starting LuxeSalon CRM Backend and Frontend Servers
echo ====================================================

start "LuxeSalon Backend (Port 8005)" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8005"
start "LuxeSalon Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers are launching in separate windows:
echo - Backend:  http://127.0.0.1:8005
echo - Frontend: http://localhost:5173
echo ====================================================
pause
