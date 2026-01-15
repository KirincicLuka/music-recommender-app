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
  itunesData: [{
    country: String,              // HR, US, GB, etc.
    itunesId: Number,
    itunesUrl: String,
    previewUrl: String,           // Backup preview link
    artworkUrl600: String,        // Visoka rezolucija cover
    trackPrice: Number,
    currency: String,
    collectionName: String,       // Album ime iz iTunes
    discNumber: Number,
    trackNumber: Number,
    isrc: String                  // International Standard Recording Code
  }],
  
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
  
  createdAt: { type: Date, default: Date.now }
});

SongSchema.index({ title: 'text', artist: 'text', album: 'text' });

module.exports = mongoose.model('Song', SongSchema);
