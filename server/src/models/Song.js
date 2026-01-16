const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
  deezerId: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  album: String,
  preview: String,
  cover: String,
  duration: Number,
  rank: Number,
  releaseDate: String,
  genre: String,
  lyrics: String,
  musicVideo: String,
  mood: String,
  
  // DEEZER OBOGAĆENI PODACI
  bpm: Number,                    // Tempo
  gain: Number,                   // Audio gain/normalizacija
  explicitLyrics: Boolean,        // Eksplicitni sadržaj
  contributors: [{                // Producenti, featured artists
    id: Number,
    name: String,
    role: String
  }],
  
  // iTUNES PODACI (višestruke regije)
 itunesData: {
  type: [{
    country: String,
    itunesId: Number,
    itunesUrl: String,
    previewUrl: String,
    artworkUrl600: String,
    trackPrice: Number,
    currency: String,
    collectionName: String,
    discNumber: Number,
    trackNumber: Number,
    isrc: String
  }],
  default: []
},
  
  // LAST.FM PODACI (za preporuke)
  lastfmData: {
    playcount: Number,            // Ukupno slušanja
    listeners: Number,            // Broj unique listenera
    tags: [String],               // Žanrovi i tagovi
    mbid: String,                 // MusicBrainz ID
    similarTracks: [{             // Slične pjesme
      name: String,
      artist: String,
      match: Number               // 0-1 similarity score
    }]
  },
  popularity: Number,
  youtubeData: {
  videoId: String,
  views: Number,
  likes: Number,
  commentCount: Number,

  sentiment: {
    positive: Number,
    neutral: Number,
    negative: Number,
    score: Number
  },

  fetchedAt: Date
},          // Kombinirana metrike popularnosti
  
  createdAt: { type: Date, default: Date.now }
});

SongSchema.index({ title: 'text', artist: 'text', album: 'text' });

module.exports = mongoose.model('Song', SongSchema);