const mongoose = require('mongoose');

const SongSnapshotSchema = new mongoose.Schema({
  songId: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true },
  counter: { type: Number, required: true },
  score: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  snapshotId: { type: String }
});

module.exports = mongoose.model('SongSnapshot', SongSnapshotSchema);