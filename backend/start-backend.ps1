# Backend Startup Script
# This script kills any existing Node processes and starts the backend server

Write-Host "🔄 Stopping any existing Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "⏳ Waiting for ports to be released..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "🚀 Starting backend server..." -ForegroundColor Green
npm run dev
