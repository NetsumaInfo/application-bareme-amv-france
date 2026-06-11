@echo off
title AMV Notation - Lancement
cd /d "%~dp0"

set "PORT=5173"

echo Verification du port %PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    echo Port %PORT% occupe par PID %%a - arret du process...
    taskkill /F /PID %%a >nul 2>&1
)

echo Lancement de AMV Notation...
npm run tauri dev
pause
