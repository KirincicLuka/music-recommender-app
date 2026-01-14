const axios = require('axios');

let accessToken = null;
let tokenExpiry = 0;

/**
 * Dobijanje Spotify access tokena koristeći Client Credentials Flow
 */
async function getAccessToken() {
  // Ako token još nije istekao, vrati postojeći
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured');
  }

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
      }
    );

    accessToken = response.data.access_token;
    // Token vrijedi 3600 sekundi (1 sat), obnovit ćemo 5 min prije isteka
    tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;
    return accessToken;
  } catch (error) {
    console.error('Spotify token error:', error.response?.data || error.message);
    throw new Error('Failed to get Spotify access token');
  }
}

/**
 * Pretraga pjesama na Spotify-u
 * @param {string} query - Pretraga (ime pjesme, umjetnik, album)
 * @param {number} limit - Broj rezultata (default 20)
 * @returns {Promise<Array>} - Niz normalizovanih pjesama
 */
async function searchTracks(query, limit = 20) {
  if (!query) return [];

  try {
    const token = await getAccessToken();
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        q: query,
        type: 'track',
        limit,
      },
    });

    // Normalizujemo podatke u format koji koristimo u projektu
    return response.data.tracks.items.map((track) => ({
      source: 'spotify',
      externalId: track.id,
      name: track.name,
      artist: track.artists.map((a) => a.name).join(', '),
      album: track.album.name,
      imageUrl: track.album.images[0]?.url || null,
      previewUrl: track.preview_url, // 30s preview (može biti null)
      spotifyUrl: track.external_urls.spotify,
      duration: track.duration_ms,
      releaseDate: track.album.release_date,
    }));
  } catch (error) {
    console.error('Spotify search error:', error.response?.data || error.message);
    return []; // Vraćamo prazan niz ako nešto pođe po zlu
  }
}

/**
 * Dohvati detalje o jednoj pjesmi
 * @param {string} trackId - Spotify track ID
 */
async function getTrackById(trackId) {
  try {
    const token = await getAccessToken();
    const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const track = response.data;
    return {
      source: 'spotify',
      externalId: track.id,
      name: track.name,
      artist: track.artists.map((a) => a.name).join(', '),
      album: track.album.name,
      imageUrl: track.album.images[0]?.url || null,
      previewUrl: track.preview_url,
      spotifyUrl: track.external_urls.spotify,
      duration: track.duration_ms,
      releaseDate: track.album.release_date,
    };
  } catch (error) {
    console.error('Spotify getTrackById error:', error.response?.data || error.message);
    return null;
  }
}

module.exports = {
  searchTracks,
  getTrackById,
};
