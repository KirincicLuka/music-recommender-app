const axios = require("axios");
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", "..", ".env"),
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function norm(s = "") {
  return String(s)
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s*\[.*?\]\s*/g, " ")
    .replace(/\s*-\s.*$/g, " ")
    .replace(/\bfeat\.?\b|\bft\.?\b/gi, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreCandidate(wantTitle, wantArtist, candTitle, candArtist) {
  const t = norm(candTitle);
  const a = norm(candArtist);

  let score = 0;

  if (t === wantTitle) score += 100;
  else if (t.includes(wantTitle) || wantTitle.includes(t)) score += 60;

  if (a === wantArtist) score += 80;
  else if (a.includes(wantArtist) || wantArtist.includes(a)) score += 40;

  if (
    (t.includes(wantTitle) || wantTitle.includes(t)) &&
    (a.includes(wantArtist) || wantArtist.includes(a))
  ) {
    score += 20;
  }

  return score;
}

function pickBestResult(results, title, artist) {
  if (!results?.length) return null;

  const wantTitle = norm(title);
  const wantArtist = norm(artist);

  let best = null;
  let bestScore = -1;

  for (const r of results) {
    const s = scoreCandidate(wantTitle, wantArtist, r.trackName, r.artistName);
    if (s > bestScore) {
      bestScore = s;
      best = r;
    }
  }

  if (bestScore < 60) return null;

  return best;
}

async function itunesSearch(term, country, limit = 10, maxRetries = 6) {
  const url = "https://itunes.apple.com/search";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await axios.get(url, {
        params: {
          term,
          media: "music",
          entity: "song",
          country,
          limit,
        },
        timeout: 15000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          Accept: "application/json",
        },
      });

      return res.data?.results || [];
    } catch (err) {
      const status = err?.response?.status;

      if (status === 429) {
        const wait = Math.min(60000, 2000 * Math.pow(2, attempt)) + Math.floor(Math.random() * 500);
        console.log(`429 for ${country}, waiting ${wait}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        await sleep(wait);
        continue;
      }

      if (status === 403) {
        const wait = 8000 + Math.floor(Math.random() * 2000);
        console.log(`403 for ${country}, cooling down ${wait}ms`);
        await sleep(wait);
        return []; 
      }

      console.log(`iTunes error ${status || ""} ${err.message}`);
      return [];
    }
  }

  return [];
}

async function searchItunesTrack(title, artist, country) {
  const queries = [
    `${title} ${artist}`,
    `${title}`,
    `${artist} ${title}`,
  ];

  for (const q of queries) {
    // global rate-limit: 1 req / ~900ms
    await sleep(900);

    const results = await itunesSearch(q, country, 10);
    const best = pickBestResult(results, title, artist);
    if (best) {
      return {
        country,
        itunesId: best.trackId,
        itunesUrl: best.trackViewUrl,
        previewUrl: best.previewUrl,
        artworkUrl600: best.artworkUrl100
          ? best.artworkUrl100.replace("100x100bb", "600x600bb")
          : null,
        trackPrice: best.trackPrice,
        currency: best.currency,
        collectionName: best.collectionName,
        discNumber: best.discNumber,
        trackNumber: best.trackNumber,
        isrc: best.isrc || null,
        matchedBy: q,
      };
    }
  }

  return null;
}

async function getMultiRegionData(title, artist) {
  // pametan redoslijed: prvo US (najveći katalog), pa GB/DE
  const countries = ["US", "GB", "DE", "HR", "JP"];

  const found = [];
  for (const c of countries) {
    const one = await searchItunesTrack(title, artist, c);
    if (one) found.push(one);

    // čim nađeš u US ili GB, često je dovoljno (smanji load)
    if (found.length >= 2) break;
  }
  return found;
}

async function enrichAllSongsWithItunes() {
  const dbUri = process.env.MONGODB_URI;
  if (!dbUri) throw new Error("MONGODB_URI is missing. Check dotenv path.");

  await mongoose.connect(dbUri);

  const Song = require("../models/Song");

  const songs = await Song.find({
    deezerId: { $exists: true, $ne: null },
    $or: [
      { itunesData: { $exists: false } },
      { itunesData: null },
      { "itunesData.0": { $exists: false } },
    ],
  });

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];

    const title = song.title?.trim();
    const artist = song.artist?.trim();

    console.log(`\n[${i + 1}/${songs.length}] ${title} — ${artist}`);

    if (!title || !artist || title === "undefined" || artist === "undefined") {
      console.log("Skip (missing title/artist)");
      skipped++;
      continue;
    }

    const itunesData = await getMultiRegionData(title, artist);

    if (itunesData.length > 0) {
      song.itunesData = itunesData;
      await song.save();
      updated++;
    } else {
      console.log("Nije pronađeno (ili API blokiran)");
      notFound++;
    }

    if ((i + 1) % 20 === 0) {
      console.log("Cooldown 15s (anti-429)");
      await sleep(15000);
    }
  }

  await mongoose.connection.close();
  console.log("Veza s bazom zatvorena");
}

if (require.main === module) {
  enrichAllSongsWithItunes()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error("Greška:", e);
      process.exit(1);
    });
}