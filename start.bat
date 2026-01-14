@echo off
REM MusicMatch App - Quick Start Script (Windows)
REM Pokrenuta oba servera (backend + frontend) istovremeno

echo.
echo ========================================
echo   MusicMatch App - Quick Start
echo ========================================
echo.

REM Provjera da li su instalovane dependencije
if not exist "server\node_modules" (
    echo [1/4] Instalacija server dependencija...
    cd server
    call npm install
    cd ..
) else (
    echo [1/4] Server dependencije vec instalirane
)

if not exist "client\node_modules" (
    echo [2/4] Instalacija client dependencija...
    cd client
    call npm install
    cd ..
) else (
    echo [2/4] Client dependencije vec instalirane
)

echo.
echo [3/4] Provera .env fajlova...
if not exist "server\.env" (
    echo UPOZORENJE: server\.env nije pronadjed!
    echo Kreiram .env fajl sa template vrijednostima...
    copy "server\.env.example" "server\.env"
)

if not exist "client\.env" (
    echo UPOZORENJE: client\.env nije pronadjed!
    echo Kreiram client\.env...
    (
        echo REACT_APP_API_URL=http://localhost:4000
    ) > "client\.env"
)

echo.
echo [4/4] Pokretanje aplikacije...
echo.
echo ========================================
echo Backend server ce biti dostupan na:
echo   http://localhost:4000
echo.
echo Frontend aplikacija ce biti dostupna na:
echo   http://localhost:3000
echo.
echo Za zaustavljanje, pritisnite CTRL+C
echo ========================================
echo.

REM Pokretamo server i client u odvojenim prozorima
start "MusicMatch Backend" cmd /k "cd server && npm run dev"
timeout /t 3
start "MusicMatch Frontend" cmd /k "cd client && npm start"

echo.
echo Aplikacija je pokrenuta!
echo Cekam da se serveri ucitaju... (10 sekundi)
timeout /t 10

REM Pokusaj da otvori frontend u browser-u
start http://localhost:3000

echo.
echo Backend: http://localhost:4000
echo Frontend: http://localhost:3000
echo.
