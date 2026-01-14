const express = require('express');
const axios = require('axios');
const Song = require('../models/Song');
const { ensureAuth } = require('../middleware/auth');
const spotify = require('../services/spotify');
const itunes = require('../services/itunes');

const router = express.Router();

/**
 * GET /api/songs/search - Multi-source pretraga
 * Pretražuje Deezer, Spotify i iTunes istovremeno i vraća sve rezultate
 */
router.get('/search', async (req, res) => {
  const { q, source } = req.query;
  
  if (!q) {
    return res.json({ deezer: [], spotify: [], itunes: [] });
  }

  try {
    // Ako je specifiran source, pretražujemo samo taj API
    if (source) {
      let results = [];
      
      if (source === 'deezer') {
        const response = await axios.get(`https://api.deezer.com/search?q=${encodeURIComponent(q)}`);
        results = response.data.data.map(song => ({
          source: 'deezer',
          externalId: song.id.toString(),
          name: song.title,
          artist: song.artist.name,
          album: song.album.title,
          imageUrl: song.album.cover_medium || song.album.cover_big,
          previewUrl: song.preview,
          deezerId: song.id.toString(),
        }));
      } else if (source === 'spotify') {
        results = await spotify.searchTracks(q);
      } else if (source === 'itunes') {
        results = await itunes.searchTracks(q);
      }
      
      return res.json({ [source]: results });
    }

    // Pretražujemo sve API-jeve paralelno
    const [deezerResponse, spotifyResults, itunesResults] = await Promise.allSettled([
      axios.get(`https://api.deezer.com/search?q=${encodeURIComponent(q)}`),
      spotify.searchTracks(q),
      itunes.searchTracks(q),
    ]);

    // Normalizujemo Deezer rezultate
    const deezerResults = deezerResponse.status === 'fulfilled'
      ? deezerResponse.value.data.data.map(song => ({
          source: 'deezer',
          externalId: song.id.toString(),
          name: song.title,
          artist: song.artist.name,
          album: song.album.title,
          imageUrl: song.album.cover_medium || song.album.cover_big,
          previewUrl: song.preview,
          deezerId: song.id.toString(),
        }))
      : [];

    // Vraćamo grupisane rezultate po izvoru
    res.json({
      deezer: deezerResults,
      spotify: spotifyResults.status === 'fulfilled' ? spotifyResults.value : [],
      itunes: itunesResults.status === 'fulfilled' ? itunesResults.value : [],
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/songs/save - Sprema pjesmu u korisnikovu biblioteku
 * Radi sa svim izvorima (deezer, spotify, itunes)
 */
router.post('/save', ensureAuth, async (req, res) => {
  const { userId, source, externalId, name, artist, album, imageUrl, previewUrl, ...rest } = req.body;

  // Koristimo req.user iz passport-a ako postoji
  const finalUserId = userId || (req.user && req.user._id);

  if (!finalUserId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  if (!source || !externalId || !name || !artist) {
    return res.status(400).json({ error: 'Missing required fields: source, externalId, name, artist' });
  }

  try {
    // Provjera da li pjesma već postoji u korisnkovoj biblioteci
    const existingSong = await Song.findOne({
      user: finalUserId,
      source,
      externalId,
    });

    if (existingSong) {
      return res.status(400).json({ error: 'Song already saved' });
    }

    // Kreiramo novi song zapis
    const songData = {
      user: finalUserId,
      source,
      externalId,
      name,
      artist,
      album,
      imageUrl,
      previewUrl,
      ...rest, // Dodatni podaci specifični za izvor (spotifyUrl, itunesUrl, genre, itd.)
    };

    const song = await Song.create(songData);
    res.json(song);
  } catch (err) {
    console.error('Save song error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/songs/user/:userId - Dohvata sve pjesme korisnika
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const songs = await Song.find({ user: req.params.userId }).sort({ addedAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/songs/:songId - Briše pjesmu iz biblioteke
 */
router.delete('/:songId', ensureAuth, async (req, res) => {
  try {
    const song = await Song.findById(req.params.songId);
    
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Provjera da li je korisnik vlasnik pjesme
    if (req.user && song.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this song' });
    }

    await Song.findByIdAndDelete(req.params.songId);
    res.json({ message: 'Song deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/songs/:songId/favorite - Toggle favorite status
 */
router.patch('/:songId/favorite', ensureAuth, async (req, res) => {
  try {
    const song = await Song.findById(req.params.songId);
    
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Provjera da li je korisnik vlasnik pjesme
    if (req.user && song.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to modify this song' });
    }

    song.favorite = !song.favorite;
    await song.save();
    
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;