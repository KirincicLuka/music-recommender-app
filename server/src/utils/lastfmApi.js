const axios = require('axios');

const LASTFM_API_KEY = process.env.LASTFM_API_KEY;

async function getLastfmTrackInfo(title, artist) {
  if (!LASTFM_API_KEY) {
    console.warn('Last.fm API key not configured');
    return null;
  }

  try {
    const response = await axios.get('http://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'track.getInfo',
        api_key: LASTFM_API_KEY,
        artist: artist,
        track: title,
        format: 'json'
      }
    });

    if (response.data.track) {
      const track = response.data.track;
      
      // Last.fm vraća playcount i listeners kao STRING, ne number
      const playcount = parseInt(track.playcount || '0', 10);
      const listeners = parseInt(track.listeners || '0', 10);
      
      console.log(`✅ Last.fm data for "${title}" by ${artist}:`, {
        playcount,
        listeners,
        tags: track.toptags?.tag?.length || 0
      });
      
      return {
        playcount: playcount,
        listeners: listeners,
        tags: track.toptags?.tag ? track.toptags.tag.map(t => t.name).slice(0, 5) : [],
        mbid: track.mbid || null
      };
    }
    
    console.warn(`⚠️ No Last.fm data found for "${title}" by ${artist}`);
    return null;
  } catch (error) {
    console.error('Last.fm track info error:', error.response?.data || error.message);
    return null;
  }
}

async function getSimilarTracks(title, artist, limit = 5) {
  if (!LASTFM_API_KEY) {
    console.warn('Last.fm API key not configured');
    return [];
  }

  try {
    const response = await axios.get('http://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'track.getSimilar',
        api_key: LASTFM_API_KEY,
        artist: artist,
        track: title,
        limit: limit,
        format: 'json'
      }
    });

    if (response.data.similartracks?.track) {
      const tracks = Array.isArray(response.data.similartracks.track) 
        ? response.data.similartracks.track 
        : [response.data.similartracks.track];
      
      console.log(`✅ Found ${tracks.length} similar tracks for "${title}"`);
      
      return tracks.map(t => ({
        name: t.name,
        artist: t.artist?.name || t.artist,
        match: parseFloat(t.match) || 0
      }));
    }
    
    console.warn(`⚠️ No similar tracks found for "${title}" by ${artist}`);
    return [];
  } catch (error) {
    console.error('Last.fm similar tracks error:', error.response?.data || error.message);
    return [];
  }
}

async function getArtistTopTracks(artist, limit = 5) {
  if (!LASTFM_API_KEY) {
    console.warn('Last.fm API key not configured');
    return [];
  }

  try {
    const response = await axios.get('http://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'artist.getTopTracks',
        api_key: LASTFM_API_KEY,
        artist: artist,
        limit: limit,
        format: 'json'
      }
    });

    if (response.data.toptracks?.track) {
      const tracks = Array.isArray(response.data.toptracks.track)
        ? response.data.toptracks.track
        : [response.data.toptracks.track];
      
      return tracks.map(t => ({
        name: t.name,
        artist: t.artist?.name || artist,
        playcount: parseInt(t.playcount || '0', 10),
        listeners: parseInt(t.listeners || '0', 10)
      }));
    }
    return [];
  } catch (error) {
    console.error('Last.fm artist top tracks error:', error.response?.data || error.message);
    return [];
  }
}

module.exports = {
  getLastfmTrackInfo,
  getSimilarTracks,
  getArtistTopTracks
};
