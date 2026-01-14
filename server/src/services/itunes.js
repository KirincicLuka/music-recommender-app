const axios = require('axios');

/**
 * Pretraga pjesama na iTunes/Apple Music
 * @param {string} query - Pretraga (ime pjesme, umjetnik, album)
 * @param {number} limit - Broj rezultata (default 20)
 * @returns {Promise<Array>} - Niz normalizovanih pjesama
 */
async function searchTracks(query, limit = 20) {
  if (!query) return [];

  try {
    const response = await axios.get('https://itunes.apple.com/search', {
      params: {
        term: query,
        media: 'music',
        entity: 'song',
        limit,
      },
    });

    // Normalizujemo podatke u format koji koristimo u projektu
    return response.data.results.map((track) => ({
      source: 'itunes',
      externalId: track.trackId.toString(),
      name: track.trackName,
      artist: track.artistName,
      album: track.collectionName,
      imageUrl: track.artworkUrl100?.replace('100x100', '600x600') || track.artworkUrl100, // Veća slika
      previewUrl: track.previewUrl, // 30s preview
      itunesUrl: track.trackViewUrl,
      duration: track.trackTimeMillis,
      releaseDate: track.releaseDate,
      genre: track.primaryGenreName,
      price: track.trackPrice,
      currency: track.currency,
    }));
  } catch (error) {
    console.error('iTunes search error:', error.response?.data || error.message);
    return []; // Vraćamo prazan niz ako nešto pođe po zlu
  }
}

/**
 * Dohvati detalje o jednoj pjesmi
 * @param {string} trackId - iTunes track ID
 */
async function getTrackById(trackId) {
  try {
    const response = await axios.get('https://itunes.apple.com/lookup', {
      params: {
        id: trackId,
      },
    });

    if (response.data.results.length === 0) {
      return null;
    }

    const track = response.data.results[0];
    return {
      source: 'itunes',
      externalId: track.trackId.toString(),
      name: track.trackName,
      artist: track.artistName,
      album: track.collectionName,
      imageUrl: track.artworkUrl100?.replace('100x100', '600x600') || track.artworkUrl100,
      previewUrl: track.previewUrl,
      itunesUrl: track.trackViewUrl,
      duration: track.trackTimeMillis,
      releaseDate: track.releaseDate,
      genre: track.primaryGenreName,
      price: track.trackPrice,
      currency: track.currency,
    };
  } catch (error) {
    console.error('iTunes getTrackById error:', error.response?.data || error.message);
    return null;
  }
}

module.exports = {
  searchTracks,
  getTrackById,
};
