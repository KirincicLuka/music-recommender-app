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
  createdAt: { type: Date, default: Date.now }
});

SongSchema.index({ title: 'text', artist: 'text', album: 'text' });

module.exports = mongoose.model('Song', SongSchema);