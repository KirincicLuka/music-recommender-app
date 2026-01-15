const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Izvor pjesme (deezer, spotify, itunes, napster)
  source: { type: String, required: true, enum: ['deezer', 'spotify', 'itunes', 'napster'] },
  
  // ID iz eksternog API-ja
  externalId: { type: String, required: true },
  
  // Osnovni podaci o pjesmi
  name: { type: String, required: true }, // Ime pjesme (bilo title)
  artist: { type: String, required: true },
  album: String,
  
  // Media URLs
  imageUrl: String, // Cover art (bilo cover)
  previewUrl: String, // 30s preview (bilo preview)
  
  // Dodatni metapodaci
  duration: Number, // trajanje u ms
  releaseDate: String,
  genre: String,
  
  // Deezer specifični podaci (legacy za kompatibilnost)
  deezerId: String,
  audioDBArtistId: String,
  
  // Spotify specifični podaci
  spotifyUrl: String,
  
  // iTunes specifični podaci
  itunesUrl: String,
  price: Number,
  currency: String,
  
  // User preferences
  favorite: { type: Boolean, default: false },
  addedAt: { type: Date, default: Date.now }
});

// Indeks za brže pretraživanje
SongSchema.index({ user: 1, source: 1, externalId: 1 }, { unique: true });

module.exports = mongoose.model('Song', SongSchema);
