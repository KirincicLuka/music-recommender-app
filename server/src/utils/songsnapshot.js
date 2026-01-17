const mongoose = require('mongoose');
const Song = require('../models/Song');
const SongSnapshot = require('../models/Songsnapshot');
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", "..", ".env"),
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

async function createSnapshot() {
  const snapshotId = new Date().toISOString(); 
  const songs = await Song.find();
  let maxcount = await Song.findOne().sort({ counter: -1 }).limit(1).then(s => s ? s.counter : 1) || 1;
  let maxSpotify = await Song.findOne().sort({ popularity: -1 }).limit(1).then(s => s ? s.popularity : 1) || 1;
  let maxLastfmPlaycount = await Song.findOne().sort({ 'lastfmData.playcount': -1 }).limit(1).then(s => s?.lastfmData?.playcount || 1) || 1;
  let maxLastfmListeners = await Song.findOne().sort({ 'lastfmData.listeners': -1 }).limit(1).then(s => s?.lastfmData?.listeners || 1) || 1;
  let maxMusicbrainzRating = await Song.findOne().sort({ 'musicbrainzData.rating.value': -1 }).limit(1).then(s => s?.musicbrainzData?.rating?.value || 1) || 1;
  let maxYoutubeViews = await Song.findOne().sort({ 'youtubeData.views': -1 }).limit(1).then(s => s?.youtubeData?.views || 1) || 1;
  let maxYoutubeLikes = await Song.findOne().sort({ 'youtubeData.likes': -1 }).limit(1).then(s => s?.youtubeData?.likes || 1) || 1;
  for (const song of songs) {
    let score = 0;
    let count = song.counter || 0;
    let spotifyPopularity = song.popularity || 0;
    let lastfmPlaycount = song.lastfmData?.playcount || 0;
    let lastfmListeners = song.lastfmData?.listeners || 0;
    let musicbrainzRating = song.musicbrainzData?.rating?.value || 0;
    let youtubeViews = song.youtubeData?.views || 0;
    let youtubeLikes = song.youtubeData?.likes || 0;
  
  const weights = {
    counter: 0.3,
    spotify_popularity: 0.2,
    lastfm_playcount: 0.1,
    lastfm_listeners: 0.1,
    musicbrainz_rating: 0.1,
    youtube_views: 0.1,
    youtube_likes: 0.1
  };

    score = count / maxcount * weights.counter +
            spotifyPopularity / maxSpotify * weights.spotify_popularity +
            lastfmPlaycount / maxLastfmPlaycount * weights.lastfm_playcount +
            lastfmListeners / maxLastfmListeners * weights.lastfm_listeners +
            musicbrainzRating / maxMusicbrainzRating * weights.musicbrainz_rating +
            youtubeViews / maxYoutubeViews * weights.youtube_views +
            youtubeLikes / maxYoutubeLikes * weights.youtube_likes;
    await SongSnapshot.create({
      songId: song._id,
      counter: song.counter || 0,
      score,
      snapshotId,
      createdAt: new Date()
    });

    console.log(`✅ Snapshot saved for: ${song.title} – Score: ${score.toFixed(3)}`);
  }

  console.log(`🏁 Snapshot created for ${songs.length} songs`);
  mongoose.disconnect();
}

createSnapshot().catch(err => {
  console.error('❌ Error creating snapshot:', err);
  mongoose.disconnect();
});
