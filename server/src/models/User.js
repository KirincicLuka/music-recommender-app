const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: { type: String, unique: true, sparse: true },
  facebookId: { type: String, unique: true, sparse: true },
  ime: String,
  prezime: String,
  email: { type: String, index: true },
  avatar: String,
  
  // Eksplicitne preferencije korisnika
  preferredGenres: {
    type: [String],
    default: []
  },
  
  // Onboarding status
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  
  // Preferirana raspoloženja (mood)
  preferredMoods: {
    type: [String],
    default: []
  },
  
  createdAt: { type: Date, default: Date.now }
});

// Index za brže pretraživanje
UserSchema.index({ email: 1, googleId: 1, facebookId: 1 });

module.exports = mongoose.model('User', UserSchema);
