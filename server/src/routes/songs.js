const express = require('express');
const Song = require('../models/Song');
const Favorite = require('../models/Favorite');
const router = express.Router();

router.get('/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  try {
    const songs = await Song.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(50);

    if (songs.length === 0) {
      const regex = new RegExp(q, 'i');
      const regexSongs = await Song.find({
        $or: [
          { title: regex },
          { artist: regex },
          { album: regex }
        ]
      }).limit(50);
      
      return res.json(regexSongs);
    }

    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/all', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const songs = await Song.find()
      .sort({ rank: -1 }) 
      .skip(skip)
      .limit(limit);

    const total = await Song.countDocuments();

    res.json({
      songs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/favorite', async (req, res) => {
  const { userId, songId } = req.body;

  try {
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    const favorite = await Favorite.create({
      user: userId,
      song: songId
    });

    const populated = await Favorite.findById(favorite._id).populate('song');
    res.json(populated);

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Song already in favorites' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.get('/favorites/:userId', async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.params.userId })
      .populate('song')
      .sort({ addedAt: -1 });

    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/favorite/:favoriteId', async (req, res) => {
  try {
    await Favorite.findByIdAndDelete(req.params.favoriteId);
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const totalSongs = await Song.countDocuments();
    const totalFavorites = await Favorite.countDocuments();
    
    res.json({
      totalSongs,
      totalFavorites
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;