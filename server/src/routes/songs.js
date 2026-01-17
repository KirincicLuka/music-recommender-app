const express = require('express');
const Song = require('../models/Song');
const Favorite = require('../models/Favorite');
const User = require('../models/User');
const { enrichWithDeezer } = require('../utils/deezerApi');
const { getMultiRegionData } = require('../utils/itunesApi');
const { getLastfmTrackInfo, getSimilarTracks } = require('../utils/lastfmApi');

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
    const totalUsers = await User.countDocuments();
    
    res.json({
      totalSongs,
      totalUsers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/enrich/:songId', async (req, res) => {
  try {
    const song = await Song.findById(req.params.songId);
    
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Dohvati podatke paralelno
    const [deezerData, itunesData, lastfmInfo, similarTracks] = await Promise.all([
      enrichWithDeezer(song.title, song.artist),
      getMultiRegionData(song.title, song.artist),
      getLastfmTrackInfo(song.title, song.artist),
      getSimilarTracks(song.title, song.artist, 5)
    ]);

    let updated = false;

    // Ažuriraj Deezer podatke
    if (deezerData) {
      song.bpm = deezerData.bpm;
      song.gain = deezerData.gain;
      song.explicitLyrics = deezerData.explicitLyrics;
      song.contributors = deezerData.contributors;
      
      // Ažuriraj preview i cover ako je bolji quality
      if (deezerData.preview) song.preview = deezerData.preview;
      if (deezerData.cover) song.cover = deezerData.cover;
      
      updated = true;
    }

    // Ažuriraj iTunes podatke
    if (itunesData && itunesData.length > 0) {
      song.itunesData = itunesData;
      updated = true;
    }

    // Ažuriraj Last.fm podatke
    if (lastfmInfo || similarTracks.length > 0) {
      song.lastfmData = {
        playcount: lastfmInfo?.playcount || 0,
        listeners: lastfmInfo?.listeners || 0,
        tags: lastfmInfo?.tags || [],
        mbid: lastfmInfo?.mbid || null,
        similarTracks: similarTracks
      };
      updated = true;
    }

    if (!updated) {
      return res.status(404).json({ 
        error: 'No additional data found from any API',
        song 
      });
    }

    await song.save();

    res.json({ 
      message: 'Song enriched successfully', 
      song,
      enrichedWith: {
        deezer: !!deezerData,
        itunes: itunesData?.length > 0,
        lastfm: !!lastfmInfo || similarTracks.length > 0
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Batch obogaćivanje
router.post('/enrich-all', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const songs = await Song.find({ 
      $or: [
        { bpm: { $exists: false } },
        { itunesData: { $exists: false } },
        { lastfmData: { $exists: false } }
      ]
    }).limit(limit);
    
    let enriched = 0;
    let failed = 0;

    for (const song of songs) {
      try {
        const [deezerData, itunesData, lastfmInfo, similarTracks] = await Promise.all([
          enrichWithDeezer(song.title, song.artist),
          getMultiRegionData(song.title, song.artist),
          getLastfmTrackInfo(song.title, song.artist),
          getSimilarTracks(song.title, song.artist, 5)
        ]);

        let songUpdated = false;

        if (deezerData) {
          song.bpm = deezerData.bpm;
          song.gain = deezerData.gain;
          song.explicitLyrics = deezerData.explicitLyrics;
          song.contributors = deezerData.contributors;
          if (deezerData.preview) song.preview = deezerData.preview;
          if (deezerData.cover) song.cover = deezerData.cover;
          songUpdated = true;
        }

        if (itunesData && itunesData.length > 0) {
          song.itunesData = itunesData;
          songUpdated = true;
        }

        if (lastfmInfo || similarTracks.length > 0) {
          song.lastfmData = {
            playcount: lastfmInfo?.playcount || 0,
            listeners: lastfmInfo?.listeners || 0,
            tags: lastfmInfo?.tags || [],
            mbid: lastfmInfo?.mbid || null,
            similarTracks: similarTracks
          };
          songUpdated = true;
        }

        if (songUpdated) {
          await song.save();
          enriched++;
        } else {
          failed++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (err) {
        console.error(`Failed to enrich ${song.title}:`, err.message);
        failed++;
      }
    }

    res.json({
      message: 'Batch enrichment completed',
      enriched,
      failed,
      total: songs.length
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dohvati preporuke bazirane na Last.fm
router.get('/recommendations/:songId', async (req, res) => {
  try {
    const song = await Song.findById(req.params.songId);
    
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    console.log(`🔍 Getting recommendations for: ${song.title} by ${song.artist}`);

    // Dohvati sa Last.fm
    const similarTracks = await getSimilarTracks(song.title, song.artist, 10);
    
    if (similarTracks.length === 0) {
      console.warn(`⚠️ No similar tracks from Last.fm for ${song.title}`);
      return res.json({
        source: 'lastfm',
        recommendations: [],
        allSuggestions: [],
        message: 'No recommendations found. The song might be too new or not indexed.'
      });
    }

    console.log(`✅ Found ${similarTracks.length} similar tracks from Last.fm`);

    // Probaj pronaći u bazi (opciono)
    const trackTitles = similarTracks.map(t => t.name);
    const songsInDb = await Song.find({
      title: { $in: trackTitles }
    }).limit(10);

    console.log(`📊 Found ${songsInDb.length} matching songs in database`);

    // Ako nema u bazi, vrati Last.fm sugestije kao plain objekte
    if (songsInDb.length === 0) {
      const recommendations = similarTracks.map(track => ({
        title: track.name,
        artist: track.artist,
        cover: 'https://via.placeholder.com/150?text=' + encodeURIComponent(track.name.substring(0, 1)),
        match: track.match,
        _id: null // Nema ID jer nije u bazi
      }));

      return res.json({
        source: 'lastfm',
        recommendations: recommendations,
        allSuggestions: similarTracks,
        inDatabase: false
      });
    }

    res.json({
      source: 'lastfm',
      recommendations: songsInDb,
      allSuggestions: similarTracks,
      inDatabase: true
    });

  } catch (err) {
    console.error('❌ Recommendations error:', err);
    res.status(500).json({ error: err.message });
  }
});


router.get('/test-lastfm', async (req, res) => {
  const axios = require('axios');
  const apiKey = process.env.LASTFM_API_KEY;
  
  console.log('Testing Last.fm API...');
  console.log('API Key exists:', !!apiKey);
  console.log('API Key length:', apiKey?.length);
  
  try {
    const response = await axios.get('http://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'track.getInfo',
        api_key: apiKey,
        artist: 'Coldplay',
        track: 'Yellow',
        format: 'json'
      }
    });

    res.json({
      success: true,
      apiKeyExists: !!apiKey,
      apiKeyLength: apiKey?.length,
      lastfmResponse: response.data,
      playcount: response.data.track?.playcount,
      listeners: response.data.track?.listeners
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      apiKeyExists: !!apiKey,
      responseData: error.response?.data
    });
  }
});

router.post('/:songId/view', async (req, res) => {
  try {
    const song = await Song.findById(req.params.songId);
    
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Povećaj counter i ažuriraj vrijeme
    song.viewCount = (song.viewCount || 0) + 1;
    song.lastViewedAt = new Date();
    
    await song.save();
    
    console.log(`👁️ View tracked: ${song.title} (${song.viewCount} views)`);
    
    res.json({
      success: true,
      viewCount: song.viewCount,
      message: 'View tracked'
    });

  } catch (err) {
    console.error('❌ View tracking error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;