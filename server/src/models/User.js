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

   indirectPreferences: {
    detectedGenres: {
      type: [String],
      default: []
    },
    detectedArtists: {
      type: [String],
      default: []
    },
    source: {
      type: String,
      enum: ['facebook', 'google', 'listening_history', 'collaborative'],
      default: null
    },
    detectedAt: {
      type: Date,
      default: null
    },
    confidence: {
      type: Number, // 0-100
      default: 0
    }
  },

   effectiveGenres: {
    type: [String],
    default: []
  },
  
  createdAt: { type: Date, default: Date.now }
});

// Index za brže pretraživanje
UserSchema.index({ email: 1, googleId: 1, facebookId: 1 });

// ✅ VIRTUAL: Kombinirani žanrovi (eksplicitni + indirektni)
UserSchema.virtual('allPreferredGenres').get(function () {
  const explicit = this.preferredGenres || [];
  const indirect = this.indirectPreferences?.detectedGenres || [];
  return [...new Set([...explicit, ...indirect])];
});

// ✅ PRE-SAVE HOOK: Ažuriraj effectiveGenres
// Koristi async hook bez "next" (stabilnije)
UserSchema.pre('save', function () {
  const explicit = this.preferredGenres || [];
  const indirect = this.indirectPreferences?.detectedGenres || [];

  // Hybrid: eksplicitni + max 3 indirektna (da ne preplavi)
  this.effectiveGenres = [...new Set([...explicit, ...indirect.slice(0, 3)])];
});

module.exports = mongoose.model('User', UserSchema);
