const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", "..", ".env"),
});
const mongoose = require('mongoose');
const axios = require('axios');
const Song = require('../models/Song');

mongoose.connect(process.env.MONGODB_URI);

const mbClient = axios.create({
  baseURL: 'https://musicbrainz.org/ws/2',
  headers: {
    'User-Agent': 'MusicMatch/1.0 ( dominikskabi2@gmail.com )'
  },
  timeout: 8000
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function findRecordingMBID(title, artist) {
  const { data } = await mbClient.get('/recording', {
    params: {
      query: `recording:"${title}" AND artist:"${artist}"`,
      limit: 1,
      fmt: 'json'
    }
  });

  return data.recordings?.[0] || null;
}

async function getRecordingRating(mbid) {
  const { data } = await mbClient.get(`/recording/${mbid}`, {
    params: { inc: 'ratings', fmt: 'json' }
  });

  if (!data.rating || data.rating['votes-count'] === 0) return null;

  return {
    value: data.rating.value,
    votes: data.rating['votes-count']
  };
}

async function enrichSong(song) {
  const recording = await findRecordingMBID(song.title, song.artist);
  if (!recording) return false;
  if (!song.title || !song.artist) {
  console.log('⏭️ Skipping invalid song');
  return false;
}
  const rating = await getRecordingRating(recording.id);
  if (!rating) return false;

  song.musicbrainzData = {
    mbid: recording.id,
    rating,
    releaseGroupId: recording['release-group']?.id || null
  };

  await song.save();
  return true;
}

async function run() {
  const songs = await Song.find({
    'musicbrainzData.rating': { $exists: false }
  });

  for (const song of songs) {
    try {
      console.log(`🎵 ${song.title} – ${song.artist}`);
      const ok = await enrichSong(song);
      console.log(ok ? '✅ Rating saved' : '⚠️ No rating found');
      await sleep(1800);
    } catch (err) {
      console.error('❌ Error:', err.message);
    }
  }

  mongoose.disconnect();
}

run();
