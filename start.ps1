# MusicMatch App - Quick Start Script (PowerShell)
# Pokrenuta oba servera (backend + frontend) istovremeno

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   MusicMatch App - Quick Start" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Provjera da li su instalovane dependencije
if (-not (Test-Path "server\node_modules")) {
    Write-Host "[1/4] Instalacija server dependencija..." -ForegroundColor Yellow
    Set-Location server
    npm install
    Set-Location ..
} else {
    Write-Host "[1/4] Server dependencije vec instalirane" -ForegroundColor Green
}

if (-not (Test-Path "client\node_modules")) {
    Write-Host "[2/4] Instalacija client dependencija..." -ForegroundColor Yellow
    Set-Location client
    npm install
    Set-Location ..
} else {
    Write-Host "[2/4] Client dependencije vec instalirane" -ForegroundColor Green
}

Write-Host "`n[3/4] Provera .env fajlova..." -ForegroundColor Yellow

if (-not (Test-Path "server\.env")) {
    Write-Host "UPOZORENJE: server\.env nije pronadjed!" -ForegroundColor Red
    Write-Host "Kreiram .env fajl sa template vrijednostima..." -ForegroundColor Yellow
    Copy-Item "server\.env.example" "server\.env"
}

if (-not (Test-Path "client\.env")) {
    Write-Host "UPOZORENJE: client\.env nije pronadjed!" -ForegroundColor Red
    Write-Host "Kreiram client\.env..." -ForegroundColor Yellow
    @"
REACT_APP_API_URL=http://localhost:4000
"@ | Out-File -FilePath "client\.env" -Encoding UTF8
}

Write-Host "`n[4/4] Pokretanje aplikacije..." -ForegroundColor Yellow
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Backend server ce biti dostupan na:" -ForegroundColor Green
Write-Host "   http://localhost:4000" -ForegroundColor White
Write-Host "`nFrontend aplikacija ce biti dostupna na:" -ForegroundColor Green
Write-Host "   http://localhost:3000" -ForegroundColor White
Write-Host "`nZa zaustavljanje, pritisnite CTRL+C" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Pokretanje backend-a
Write-Host "Pokretam backend server..." -ForegroundColor Green
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; npm run dev"

# Čekanje 3 sekunde prije pokretanja frontend-a
Start-Sleep -Seconds 3

# Pokretanje frontend-a
Write-Host "Pokretam frontend aplikaciju..." -ForegroundColor Green
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$PWD\client'; npm start"

Write-Host "`nČekam da se serveri ucitaju... (10 sekundi)" -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Pokusaj da otvori frontend u browser-u
Write-Host "Otvarama browser..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host "`nAplikacija je pokrenuta!`n" -ForegroundColor Green
Write-Host "Backend: http://localhost:4000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "`n"
