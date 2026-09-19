@echo off
cd /d "%~dp0"
start "" /b powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:4173'"
node server.mjs
if errorlevel 1 pause
