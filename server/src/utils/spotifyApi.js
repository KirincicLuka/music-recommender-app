const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", "..", ".env"),
});
const axios = require("axios");
const mongoose = require("mongoose");
const Song = require("../models/Song");

/* ─────────────────────────────────────────────── */
/* SPOTIFY AUTH */
/* ─────────────────────────────────────────────── */

async function getSpotifyToken() {
  const res = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            process.env.SPOTIFY_CLIENT_ID +
              ":" +
              process.env.SPOTIFY_CLIENT_SECRET
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return res.data.access_token;
}

/* ─────────────────────────────────────────────── */
/* SPOTIFY SEARCH */
/* ─────────────────────────────────────────────── */

async function getSpotifyPopularity(token, title, artist) {
  try {
    const query = `track:${title} artist:${artist}`;

    const res = await axios.get(
      "https://api.spotify.com/v1/search",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          q: query,
          type: "track",
          limit: 1
        }
      }
    );

    const track = res.data.tracks.items[0];
    if (!track) return null;

    return track.popularity; // 0–100
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────── */
/* JOB */
/* ─────────────────────────────────────────────── */

async function run() {
  console.log("🚀 Spotify popularity enrichment started");

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ MongoDB connected");

  const token = await getSpotifyToken();

  // Only process songs missing popularity
  const songs = await Song.find({
    popularity: { $exists: false }
  }).limit(200);

  console.log(`🎵 Songs to process: ${songs.length}`);

  for (const song of songs) {
    console.log(`➡️ ${song.title} – ${song.artist}`);

    const popularity = await getSpotifyPopularity(
      token,
      song.title,
      song.artist
    );

    if (popularity === null) {
      console.log("⚠️ No Spotify match");
      continue;
    }

    await Song.updateOne(
      { _id: song._id },
      { $set: { popularity } }
    );

    console.log(`✅ Spotify popularity = ${popularity}`);

    // Rate-limit safety
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("🏁 Job finished");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("❌ Job failed", err);
  process.exit(1);
});