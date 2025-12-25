const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deezerId: String,
  title: String,
  artist: String,
  album: String,
  preview: String,
  cover: String,
  audioDBArtistId: String,
  favorite: { type: Boolean, default: false },
  addedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Song', SongSchema);
