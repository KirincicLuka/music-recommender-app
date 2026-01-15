#!/bin/bash
# MusicMatch App - Quick Start Script (Linux/Mac)
# Pokrenuta oba servera (backend + frontend) istovremeno

echo ""
echo "========================================"
echo "   MusicMatch App - Quick Start"
echo "========================================"
echo ""

# Provjera da li su instalovane dependencije
if [ ! -d "server/node_modules" ]; then
    echo "[1/4] Instalacija server dependencija..."
    cd server
    npm install
    cd ..
else
    echo "[1/4] Server dependencije vec instalirane"
fi

if [ ! -d "client/node_modules" ]; then
    echo "[2/4] Instalacija client dependencija..."
    cd client
    npm install
    cd ..
else
    echo "[2/4] Client dependencije vec instalirane"
fi

echo ""
echo "[3/4] Provera .env fajlova..."

if [ ! -f "server/.env" ]; then
    echo "UPOZORENJE: server/.env nije pronađen!"
    echo "Kreiram .env fajl sa template vrijednostima..."
    cp "server/.env.example" "server/.env"
fi

if [ ! -f "client/.env" ]; then
    echo "UPOZORENJE: client/.env nije pronađen!"
    echo "Kreiram client/.env..."
    cat > "client/.env" << EOF
REACT_APP_API_URL=http://localhost:4000
EOF
fi

echo ""
echo "[4/4] Pokretanje aplikacije..."
echo ""
echo "========================================"
echo "Backend server ce biti dostupan na:"
echo "   http://localhost:4000"
echo ""
echo "Frontend aplikacija ce biti dostupna na:"
echo "   http://localhost:3000"
echo ""
echo "Za zaustavljanje, pritisnite CTRL+C"
echo "========================================"
echo ""

# Pokretanje backend-a u background procesu
cd server
npm run dev &
SERVER_PID=$!
cd ..

# Čekanje 3 sekunde prije pokretanja frontend-a
sleep 3

# Pokretanje frontend-a u background procesu
cd client
npm start &
CLIENT_PID=$!
cd ..

echo ""
echo "Aplikacija je pokrenuta!"
echo "Backend PID: $SERVER_PID"
echo "Frontend PID: $CLIENT_PID"
echo ""
echo "Za zaustavljanje svih servera, pokrenite:"
echo "  kill $SERVER_PID $CLIENT_PID"
echo ""

# Čekaj da korisnik prekine (CTRL+C)
wait
