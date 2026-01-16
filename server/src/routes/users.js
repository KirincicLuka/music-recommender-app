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
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// GET PERSONALIZED RECOMMENDATIONS
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

    // ✅ Robustno: Set stringova (brže i sigurnije)
    const favoriteIdSet = new Set(favoriteSongIds.map(id => id.toString()));

    console.log(`❤️ User has ${favoriteSongIds.length} favorites`);

    const allRecommendations = [];

    // Helper: escape regex
    const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // KORAK 2: GENRE-BASED RECOMMENDATIONS
    if (user.preferredGenres && user.preferredGenres.length > 0) {
      console.log(`🎸 Searching for songs in genres: ${user.preferredGenres.join(', ')}`);

      // ✅ "contains" + case-insensitive match
      const genreRegexes = user.preferredGenres
        .filter(Boolean)
        .map(g => new RegExp(escapeRegex(g), 'i'));

      let genreSongs = await Song.find({
        genre: { $in: genreRegexes }
        })
        .sort({ rank: -1, popularity: -1 })
        .limit(50);

        // 2) fallback: ako nema rezultata, koristi lastfmData.tags
        if (genreSongs.length === 0) {
        genreSongs = await Song.find({
            'lastfmData.tags': { $in: genreRegexes }
        })
        .sort({ rank: -1, popularity: -1 })
        .limit(50);
      }

      console.log(`📊 Found ${genreSongs.length} songs in preferred genres`);

      // ✅ 100% filter: nikad ne vrati favorite
      const filteredGenreSongs = genreSongs.filter(song =>
        !favoriteIdSet.has(song._id.toString())
      );

      console.log(`✅ After filtering: ${filteredGenreSongs.length} genre-based recommendations`);

      allRecommendations.push(
        ...filteredGenreSongs.map(song => ({
          ...song.toObject(),
          recommendationType: 'genre'
        }))
      );
    }

    // KORAK 3: FAVORITES-BASED RECOMMENDATIONS (Last.fm)
    if (favorites.length > 0) {
      console.log(`🔄 Finding similar songs based on favorites...`);

      const favoriteBasedRecs = [];

      for (const fav of favorites.slice(0, 5)) {
        if (!fav.song) continue;

        try {
          const similarTracks = await getSimilarTracks(
            fav.song.title,
            fav.song.artist,
            5
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
                recommendationType: 'similar'
              });
            }
          }

          await new Promise(resolve => setTimeout(resolve, 250));
        } catch (err) {
          console.error(`Error for ${fav.song.title}:`, err.message);
        }
      }

      console.log(`✅ Found ${favoriteBasedRecs.length} similar song recommendations`);
      allRecommendations.push(...favoriteBasedRecs);
    }

    // KORAK 4: COLLABORATIVE FILTERING
    if (favoriteSongIds.length > 0) {
      console.log(`👥 Finding users with similar taste...`);

      const similarUsers = await Favorite.aggregate([
        { $match: { song: { $in: favoriteSongIds }, user: { $ne: user._id } } },
        { $group: { _id: '$user', commonFavorites: { $sum: 1 } } },
        { $sort: { commonFavorites: -1 } },
        { $limit: 10 }
      ]);

      if (similarUsers.length > 0) {
        const similarUserIds = similarUsers.map(u => u._id);

        const theirFavorites = await Favorite.find({
          user: { $in: similarUserIds }
        }).populate('song');

        const collabRecs = theirFavorites
          .filter(f => f.song && !favoriteIdSet.has(f.song._id.toString()))
          .map(f => ({
            ...f.song.toObject(),
            recommendationType: 'collaborative'
          }));

        console.log(`✅ Found ${collabRecs.length} collaborative recommendations`);
        allRecommendations.push(...collabRecs);
      }
    }

    // KORAK 5: DEDUPLIKACIJA
    const uniqueRecommendations = [];
    const seenIds = new Set();

    for (const song of allRecommendations) {
      const id = song._id.toString();
      if (!seenIds.has(id) && !favoriteIdSet.has(id)) { // ✅ extra safety
        seenIds.add(id);
        uniqueRecommendations.push(song);
      }
    }

    console.log(`🎯 Final count: ${uniqueRecommendations.length} unique recommendations`);

    const stats = {
      total: uniqueRecommendations.length,
      fromGenres: uniqueRecommendations.filter(s => s.recommendationType === 'genre').length,
      fromFavorites: uniqueRecommendations.filter(s => s.recommendationType === 'similar').length,
      fromCollaborative: uniqueRecommendations.filter(s => s.recommendationType === 'collaborative').length
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
