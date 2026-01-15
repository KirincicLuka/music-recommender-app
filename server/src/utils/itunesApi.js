const axios = require('axios');

// Dohvati podatke iz jedne zemlje
async function searchItunesTrack(title, artist, country = 'HR') {
  try {
    const response = await axios.get('https://itunes.apple.com/search', {
      params: {
        term: `${title} ${artist}`,
        media: 'music',
        entity: 'song',
        country: country,
        limit: 1
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const track = response.data.results[0];
      return {
        country: country,
        itunesId: track.trackId,
        itunesUrl: track.trackViewUrl,
        previewUrl: track.previewUrl,
        artworkUrl600: track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb', '600x600bb') : null,
        trackPrice: track.trackPrice,
        currency: track.currency,
        collectionName: track.collectionName,
        discNumber: track.discNumber,
        trackNumber: track.trackNumber,
        isrc: track.isrc || null
      };
    }
    return null;
  } catch (error) {
    console.error(`iTunes search error (${country}):`, error.message);
    return null;
  }
}

// Dohvati iz više zemalja paralelno
async function getMultiRegionData(title, artist) {
  const countries = ['HR', 'US', 'GB', 'DE', 'JP'];
  
  const results = await Promise.all(
    countries.map(country => searchItunesTrack(title, artist, country))
  );

  // Filtriraj null rezultate
  return results.filter(r => r !== null);
}

module.exports = {
  searchItunesTrack,
  getMultiRegionData
};
