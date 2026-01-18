const express = require('express');
const User = require('../models/User');
const Favorite = require('../models/Favorite');
const Song = require('../models/Song');
const { getSimilarTracks } = require('../utils/lastfmApi');

const router = express.Router();

// ============================================
// GET USER PROFILE WITH PREFERENCES
// ============================================
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// UPDATE USER PREFERENCES (ONBOARDING)
// ============================================
router.post('/:userId/preferences', async (req, res) => {
  const { genres, moods } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        preferredGenres: genres || [],
        preferredMoods: moods || [],
        onboardingCompleted: true
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`✅ User ${user.email} completed onboarding with genres:`, genres);

    res.json({
      message: 'Preferences saved successfully',
      user
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// UPDATE PREFERENCES (PARTIAL UPDATE)
// ============================================
router.patch('/:userId/preferences', async (req, res) => {
  const { genres, moods } = req.body;

  try {
    const updateData = {};
    if (genres) updateData.preferredGenres = genres;
    if (moods) updateData.preferredMoods = moods;

    const user = await User.findByIdAndUpdate(req.params.userId, updateData, { new: true });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GET PERSONALIZED RECOMMENDATIONS (33/33/33)
// ============================================
router.get('/:userId/recommendations', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`🎵 Generating recommendations for user: ${user.email}`);

    // KORAK 1: Dohvati SVE favorite korisnika
    const favorites = await Favorite.find({ user: user._id }).populate('song');

    const favoriteSongIds = favorites
      .filter(f => f.song)
      .map(f => f.song._id);

    const favoriteIdSet = new Set(favoriteSongIds.map(id => id.toString()));

    console.log(`❤️ User has ${favoriteSongIds.length} favorites`);

    const allRecommendations = [];

    // ====== 33/33/33 weighting config ======
    const TOTAL_LIMIT = 30;
    const PER_BUCKET = Math.floor(TOTAL_LIMIT / 3); // 10

    const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const fetchSongsByArtists = async (artists, limit = 80) => {
    const cleaned = (artists || []).map(a => String(a || '').trim()).filter(Boolean);
    if (cleaned.length === 0) return [];

    // artist match (contains), case-insensitive
    const artistRegexes = cleaned.map(a => new RegExp(escapeRegex(a), 'i'));

    return Song.find({ artist: { $in: artistRegexes } })
      .sort({ rank: -1, popularity: -1 })
      .limit(limit);
  };

    // Helper: fetch songs by genres (tries Song.genre first, then lastfmData.tags)
    const fetchSongsByGenres = async (genres, limit = 60) => {
      const cleaned = (genres || []).map(g => String(g || '').trim()).filter(Boolean);
      if (cleaned.length === 0) return [];

      const genreRegexes = cleaned.map(g => new RegExp(escapeRegex(g), 'i'));

      let songs = await Song.find({ genre: { $in: genreRegexes } })
        .sort({ rank: -1, popularity: -1 })
        .limit(limit);

      if (songs.length === 0) {
        songs = await Song.find({ 'lastfmData.tags': { $in: genreRegexes } })
          .sort({ rank: -1, popularity: -1 })
          .limit(limit);
      }

      return songs;
    };

    // KORAK 2A: EXPLICIT (preferredGenres)
    const explicitGenres = user.preferredGenres || [];
    let explicitCandidates = [];
    if (explicitGenres.length > 0) {
      console.log(`🎸 Explicit genres: ${explicitGenres.join(', ')}`);
      const explicitSongs = await fetchSongsByGenres(explicitGenres, 80);
      explicitCandidates = explicitSongs
        .filter(s => !favoriteIdSet.has(s._id.toString()))
        .map(s => ({ ...s.toObject(), recommendationType: 'explicit' }));
    }

    // KORAK 2B: INDIRECT (detectedGenres)
    // KORAK 2B: INDIRECT (detectedGenres + detectedArtists)
    const indirectGenres = user.indirectPreferences?.detectedGenres || [];
    const indirectArtists = user.indirectPreferences?.detectedArtists || [];

    let indirectCandidates = [];

    const indirectByArtists = indirectArtists.length
      ? await fetchSongsByArtists(indirectArtists, 80)
      : [];

    const indirectByGenres = indirectGenres.length
      ? await fetchSongsByGenres(indirectGenres, 80)
      : [];

    // PRIORITET: prvo artist-match, pa genre-match
    const mergedIndirect = [...indirectByArtists, ...indirectByGenres];

    const seenIndirect = new Set();

    indirectCandidates = mergedIndirect
      .filter(s => s && !favoriteIdSet.has(String(s._id)))
      .filter(s => {
        const id = String(s._id);
        if (seenIndirect.has(id)) return false;
        seenIndirect.add(id);
        return true;
      })
      .map(s => ({
        ...s.toObject(),
        recommendationType: 'indirect'
      }));


    // KORAK 3: SIMILAR TO SAVED SONGS (Last.fm)
    let similarCandidates = [];
    if (favorites.length > 0) {
      console.log(`🔄 Finding similar songs based on favorites...`);

      const favoriteBasedRecs = [];

      for (const fav of favorites.slice(0, 5)) {
        if (!fav.song) continue;

        try {
          const similarTracks = await getSimilarTracks(
            fav.song.title,
            fav.song.artist,
            6
          );

          for (const track of similarTracks) {
            const foundSong = await Song.findOne({
              title: new RegExp(escapeRegex(track.name), 'i'),
              artist: new RegExp(escapeRegex(track.artist), 'i')
            });

            if (foundSong && !favoriteIdSet.has(foundSong._id.toString())) {
              favoriteBasedRecs.push({
                ...foundSong.toObject(),
                matchScore: track.match,
                basedOn: fav.song.title,
                recommendationType: 'similarSaved'
              });
            }
          }

          await new Promise(resolve => setTimeout(resolve, 250));
        } catch (err) {
          console.error(`Error for ${fav.song.title}:`, err.message);
        }
      }

      console.log(`✅ Found ${favoriteBasedRecs.length} similar-to-saved recommendations`);
      similarCandidates = favoriteBasedRecs;
    }

    // ====== Combine with equal weights (33/33/33) ======
    const takeFromBucket = (bucket, n, out, seenIds) => {
      let added = 0;
      for (const item of bucket) {
        if (added >= n) break;
        const id = String(item._id);
        if (!id) continue;
        if (favoriteIdSet.has(id)) continue;
        if (seenIds.has(id)) continue;
        seenIds.add(id);
        out.push(item);
        added++;
      }
      return added;
    };

    const final = [];
    const seen = new Set();

    const pickedExplicit = takeFromBucket(explicitCandidates, PER_BUCKET, final, seen);
    const pickedIndirect = takeFromBucket(indirectCandidates, PER_BUCKET, final, seen);
    const pickedSimilar = takeFromBucket(similarCandidates, PER_BUCKET, final, seen);

    // Fill remaining slots from leftovers (any bucket), still excluding favorites + duplicates
    const leftovers = [
      ...explicitCandidates.slice(pickedExplicit),
      ...indirectCandidates.slice(pickedIndirect),
      ...similarCandidates.slice(pickedSimilar)
    ];

    takeFromBucket(leftovers, TOTAL_LIMIT - final.length, final, seen);

    allRecommendations.push(...final);

    // Final safety: dedup
    const uniqueRecommendations = [];
    const seenIds = new Set();

    for (const song of allRecommendations) {
      const id = song._id.toString();
      if (!seenIds.has(id) && !favoriteIdSet.has(id)) {
        seenIds.add(id);
        uniqueRecommendations.push(song);
      }
    }

    const stats = {
      total: uniqueRecommendations.length,
      fromExplicit: uniqueRecommendations.filter(s => s.recommendationType === 'explicit').length,
      fromIndirect: uniqueRecommendations.filter(s => s.recommendationType === 'indirect').length,
      fromSavedSimilar: uniqueRecommendations.filter(s => s.recommendationType === 'similarSaved').length
    };

    res.json({
      recommendations: uniqueRecommendations.slice(0, 30),
      stats,
      user: {
        onboardingCompleted: user.onboardingCompleted,
        preferredGenres: user.preferredGenres,
        totalFavorites: favorites.length
      }
    });

  } catch (err) {
    console.error('❌ Recommendations error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// CHECK ONBOARDING STATUS
// ============================================
router.get('/:userId/onboarding-status', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      onboardingCompleted: user.onboardingCompleted,
      hasPreferences: user.preferredGenres && user.preferredGenres.length > 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
