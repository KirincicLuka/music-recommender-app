const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  song: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true },
  addedAt: { type: Date, default: Date.now }
});

FavoriteSchema.index({ user: 1, song: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', FavoriteSchema);