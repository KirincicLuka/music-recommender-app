# 🎵 Music Recommender App - API Integration Guide

## 📚 Pregled Integriranih API-jeva

Projekat sada podržava **tri muzička API-ja** za pretragu i spremanje pjesama:

- 🟣 **Deezer** - Besplatan API, ne zahtijeva ključeve
- 🟢 **Spotify** - Zahtijeva Client ID i Secret
- 🔵 **iTunes/Apple Music** - Besplatan API, ne zahtijeva ključeve
- 🟠 **Napster** - (Opcionalno) Za budući razvoj

---

## 🚀 Kako pokrenuti projekat

### 1. Klonirajte repozitorijum
```bash
git clone <repository-url>
cd music-recommender-app
```

### 2. Instalirajte dependencije

**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd client
npm install
```

### 3. Konfigurišite .env fajl

Otvorite `server/.env` i popunite potrebne podatke:

```env
# MongoDB konekcija (lokalno ili MongoDB Atlas)
MONGODB_URI=mongodb://localhost:27017/music-recommender

# Server konfiguracija
PORT=4000
CLIENT_URL=http://localhost:3000

# Session secret (koristite random string)
SESSION_SECRET=some_long_random_string

# Google OAuth (za login)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback

# Spotify API
SPOTIFY_CLIENT_ID=9c5b1736dff24a7191bf7f4bf4f55090
SPOTIFY_CLIENT_SECRET=40d4a84d9f7e49b282b956b6a60935ac

# GitHub OAuth (Opcionalno)
GITHUB_CLIENT_ID=Ov23liblW10ZOAXLswoX
GITHUB_CLIENT_SECRET=3aa58acc05e0721c638e731ead11a1eb4d13c56b
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

# Napster (Opcionalno - za budući razvoj)
NAPSTER_API_KEY=your_napster_api_key
```

### 4. Pokrenite MongoDB

**Lokalno:**
```bash
mongod
```

**Ili koristite MongoDB Atlas** (cloud) i zamijenite `MONGODB_URI`.

### 5. Pokrenite servere

**Backend (u `server` folderu):**
```bash
npm run dev
```
Server će biti dostupan na: `http://localhost:4000`

**Frontend (u `client` folderu, novi terminal):**
```bash
npm start
```
React app će biti dostupan na: `http://localhost:3000`

---

## 🔑 Kako dobiti API ključeve

### Spotify API

1. Idite na: https://developer.spotify.com/dashboard
2. Prijavite se sa Spotify nalogom
3. Kliknite "Create app"
4. Popunite osnovne informacije:
   - App name: `Music Recommender`
   - App description: `Music search and recommendation app`
   - Redirect URI: `http://localhost:4000/callback` (nije kritično za Client Credentials)
5. Kliknite "Settings"
6. Kopirajte **Client ID** i **Client Secret**
7. Zalijepite ih u `server/.env` fajl

### Google OAuth (za login)

1. Idite na: https://console.cloud.google.com/
2. Kreirajte novi projekat
3. Omogućite **Google+ API**
4. Idite na **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Dodajte **Authorized redirect URIs**:
   - `http://localhost:4000/auth/google/callback`
6. Kopirajte **Client ID** i **Client Secret**
7. Zalijepite ih u `server/.env` fajl

### MongoDB (Lokalno ili Cloud)

**Lokalna instalacija:**
- Windows: https://www.mongodb.com/try/download/community
- Mac: `brew install mongodb-community`
- Linux: https://docs.mongodb.com/manual/administration/install-on-linux/

**MongoDB Atlas (besplatno u cloudu):**
1. Idite na: https://www.mongodb.com/cloud/atlas
2. Registrujte se i kreirajte besplatan cluster
3. Kliknite "Connect" → "Connect your application"
4. Kopirajte connection string
5. Zalijepite u `MONGODB_URI` (zamijenite `<password>` sa vašom lozinkom)

---

## 🎯 Kako funkcioniše Multi-Source pretraga

### Backend (`server/src/routes/songs.js`)

Kada korisnik pretražuje pjesme, backend **paralelno** poziva sve tri API-ja:

```javascript
const [deezerResults, spotifyResults, itunesResults] = await Promise.allSettled([
  axios.get('https://api.deezer.com/search?q=...'),
  spotify.searchTracks(query),
  itunes.searchTracks(query),
]);
```

Rezultati se vraćaju kao:
```json
{
  "deezer": [...],
  "spotify": [...],
  "itunes": [...]
}
```

### Frontend (`client/src/components/SearchBar.js`)

React komponenta prikazuje:
- **Tab navigaciju** za filtriranje po izvoru (All, Deezer, Spotify, iTunes)
- **Source badge** na svakoj pjesmi (obojeni labeli)
- **Audio preview** za sve pjesme (30s)
- **Save dugme** koje sprema u bazu sa informacijom o izvoru

### Database (`server/src/models/Song.js`)

Song model čuva:
- `source` - izvor pjesme (deezer, spotify, itunes)
- `externalId` - ID iz vanjskog API-ja
- `name` - ime pjesme
- `artist` - umjetnik
- `imageUrl` - cover art
- `previewUrl` - 30s audio preview

**Unique constraint**: Korisnik ne može spremiti istu pjesmu dva puta iz istog izvora.

---

## 📁 Nova Struktura Projekta

```
music-recommender-app/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── passport.js          # Google OAuth konfiguracija
│   │   ├── middleware/
│   │   │   └── auth.js              # ✅ NOVO: ensureAuth middleware
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── Song.js              # ✅ AŽURIRANO: multi-source podrška
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   └── songs.js             # ✅ AŽURIRANO: multi-source pretraga
│   │   ├── services/
│   │   │   ├── spotify.js           # ✅ NOVO: Spotify API servis
│   │   │   └── itunes.js            # ✅ NOVO: iTunes API servis
│   │   └── server.js
│   ├── .env                         # ✅ AŽURIRANO: Novi API ključevi
│   ├── .env.example
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SearchBar.js         # ✅ AŽURIRANO: Multi-source UI
│   │   │   ├── SongCard.js          # ✅ AŽURIRANO: Source badges
│   │   │   └── ...
│   │   └── ...
│   └── package.json
└── README.md
```

---

## 🧪 Testiranje

### 1. Testirajte Backend API-jeve

**Pretraga (svi izvori):**
```bash
curl "http://localhost:4000/api/songs/search?q=eminem"
```

**Pretraga (specifičan izvor):**
```bash
curl "http://localhost:4000/api/songs/search?q=eminem&source=spotify"
```

**Spremanje pjesme:**
```bash
curl -X POST http://localhost:4000/api/songs/save \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "source": "spotify",
    "externalId": "7lPN2DXiMsVn7XUKtOW1CS",
    "name": "Lose Yourself",
    "artist": "Eminem",
    "album": "8 Mile",
    "imageUrl": "...",
    "previewUrl": "..."
  }'
```

### 2. Testirajte Frontend

1. Pokrenite aplikaciju (`npm start` u oba foldera)
2. Ulogujte se sa Google nalogom
3. Pretražite pjesmu (npr. "Eminem")
4. Provjerite da li su prikazani rezultati iz sva tri izvora
5. Kliknite na tab-ove (Deezer, Spotify, iTunes) da filtrirate rezultate
6. Spremite pjesmu i provjerite da li je sačuvana u bazi
7. Idite na "Saved Songs" stranicu i provjerite da li je prikazana sa ispravnim source badge-om

---

## 🔧 Troubleshooting

### Problem: Spotify token error

**Rješenje:** Provjerite da li ste ispravno unijeli `SPOTIFY_CLIENT_ID` i `SPOTIFY_CLIENT_SECRET` u `.env` fajl.

### Problem: MongoDB connection error

**Rješenje:** 
- Provjerite da li je MongoDB pokrenut (`mongod`)
- Ili provjerite da li je `MONGODB_URI` ispravan za MongoDB Atlas

### Problem: CORS error

**Rješenje:** Provjerite da li je `CLIENT_URL` u `.env` fajlu postavljen na `http://localhost:3000`

### Problem: Rezultati se ne prikazuju

**Rješenje:**
- Otvorite Browser DevTools (F12) → Console
- Provjerite da li ima grešaka u API pozivima
- Provjerite da li backend vraća podatke u ispravnom formatu

---

## 🎉 Šta je novo?

✅ **Multi-source pretraga** - Pretražujte Deezer, Spotify i iTunes istovremeno  
✅ **Tab navigacija** - Filtrirajte rezultate po izvoru  
✅ **Source badges** - Vidite odakle je pjesma (obojeni labeli)  
✅ **Middleware autentifikacija** - Sigurnija zaštita ruta  
✅ **Normalizovani podaci** - Svi izvori vraćaju isti format  
✅ **Kompatibilnost** - Podržava i stare i nove nazive polja  

---

## 👥 Tim

Ovaj projekat razvija tim studenata kao zajednički projekat. Svaki član može dodati svoje API ključeve i doprinositi novim features.

---

## 📝 Licenca

MIT

---

**Sretan coding! 🎵🚀**
