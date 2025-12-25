const express = require('express');
const axios = require('axios');
const Song = require('../models/Song');
const router = express.Router();

router.get('/search', async (req, res) => {
  const { q } = req.query;
  try {
    const response = await axios.get(`https://api.deezer.com/search?q=${encodeURIComponent(q)}`);
    res.json(response.data.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/save', async (req, res) => {
  const { userId, title, artist, album, preview, cover } = req.body;

  try {
    const existingSong = await Song.findOne({ 
      user: userId, 
      title: title,
      artist: artist 
    });

    if (existingSong) {
      return res.status(400).json({ error: 'Song already saved' });
    }

    let finalCover = cover;
    if (!cover) {
      try {
        const audioDBRes = await axios.get(
          `https://theaudiodb.com/api/v1/json/2/searchtrack.php?s=${encodeURIComponent(artist)}&t=${encodeURIComponent(title)}`
        );
        const trackData = audioDBRes.data?.track?.[0];
        if (trackData?.strTrackThumb) {
          finalCover = trackData.strTrackThumb;
        }
      } catch (audioErr) {
        console.log('AudioDB fetch failed, using Deezer cover');
      }
    }

    const song = await Song.create({
      user: userId,
      title,
      artist,
      album,
      preview,
      cover: finalCover
    });

    res.json(song);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const songs = await Song.find({ user: req.params.userId }).sort({ addedAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Brisanje pjesme
router.delete('/:songId', async (req, res) => {
  try {
    await Song.findByIdAndDelete(req.params.songId);
    res.json({ message: 'Song deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;