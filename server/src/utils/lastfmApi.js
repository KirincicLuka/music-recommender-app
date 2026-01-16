const mongoose = require('mongoose');
const axios = require('axios');
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", "..", ".env"),
});

const { MONGODB_URI, LASTFM_API_KEY } = process.env;

if (!LASTFM_API_KEY) {
  throw new Error('LASTFM_API_KEY is missing');
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB error', err);
    process.exit(1);
  });

/* ─────────────────────────────────────────────── */
/* EXISTING MODEL */
/* ─────────────────────────────────────────────── */

const Song = require('../models/Song'); // ← YOUR existing schema

/* ─────────────────────────────────────────────── */
/* LAST.FM CLIENT */
/* ─────────────────────────────────────────────── */

const lastfmClient = axios.create({
  baseURL: 'https://ws.audioscrobbler.com/2.0/',
  timeout: 5000
});

async function getLastfmTrackInfo(title, artist) {
  try {
    const { data } = await lastfmClient.get('/', {
      params: {
        method: 'track.getInfo',
        api_key: LASTFM_API_KEY,
        artist,
        track: title,
        autocorrect: 1,
        format: 'json'
      }
    });

    if (!data.track) return null;

    return {
      playcount: parseInt(data.track.playcount || '0', 10),
      listeners: parseInt(data.track.listeners || '0', 10),
      tags: data.track.toptags?.tag
        ? data.track.toptags.tag.map(t => t.name).slice(0, 5)
        : [],
      mbid: data.track.mbid || null
    };
  } catch {
    return null;
  }
}

async function getSimilarTracks(title, artist, limit = 5) {
  try {
    const { data } = await lastfmClient.get('/', {
      params: {
        method: 'track.getSimilar',
        api_key: LASTFM_API_KEY,
        artist,
        track: title,
        autocorrect: 1,
        limit,
        format: 'json'
      }
    });

    const tracks = data.similartracks?.track || [];
    const list = Array.isArray(tracks) ? tracks : [tracks];

    return list.map(t => ({
      name: t.name,
      artist: t.artist?.name || t.artist,
      match: parseFloat(t.match) || 0
    }));
  } catch {
    return [];
  }
}

/* ─────────────────────────────────────────────── */
/* ENRICHMENT */
/* ─────────────────────────────────────────────── */

async function enrichSong(song) {
  const info = await getLastfmTrackInfo(song.title, song.artist);
  if (!info) return false;

  const similarTracks = await getSimilarTracks(song.title, song.artist);

  song.lastfmData = {
    playcount: info.playcount,
    listeners: info.listeners,
    tags: info.tags,
    mbid: info.mbid,
    similarTracks
  };

  await song.save();
  return true;
}

async function enrichAllSongs({ onlyMissing = true, limit = 50 } = {}) {
  console.log('🔍 Fetching songs from database...');

  const query = onlyMissing
    ? { 'lastfmData.playcount': { $exists: false } }
    : {};

  const count = await Song.countDocuments(query);
  console.log(`📊 Songs matching query: ${count}`);

  const songs = await Song.find(query).limit(limit);

  if (songs.length === 0) {
    console.log('⚠️ No songs to process. Exiting.');
    return;
  }

  console.log(`🎵 Enriching ${songs.length} songs`);

  for (const song of songs) {
    try {
      console.log(`➡️ Processing: ${song.title} – ${song.artist}`);

      const ok = await enrichSong(song);

      console.log(
        ok
          ? `✅ Saved Last.fm data`
          : `⚠️ No Last.fm data found`
      );

      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.warn(`❌ Error for ${song.title}:`, err.message);
    }
  }
}

async function runEnrichment() {
  try {
    await enrichAllSongs({ onlyMissing: true });
  } finally {
    mongoose.disconnect();
  }
}

module.exports = {
  enrichAllSongs,
  runEnrichment,
  getLastfmTrackInfo,
  getSimilarTracks
};

