const axios = require('axios');

// Dohvati dodatne Deezer podatke
async function enrichWithDeezer(title, artist) {
  try {
    const response = await axios.get('https://api.deezer.com/search', {
      params: {
        q: `artist:"${artist}" track:"${title}"`,
        limit: 1
      }
    });

    if (response.data.data && response.data.data.length > 0) {
      const track = response.data.data[0];
      
      // Dohvati detalje o tracku (uključuje BPM i contributors)
      const detailsResponse = await axios.get(`https://api.deezer.com/track/${track.id}`);
      const details = detailsResponse.data;
      
      return {
        deezerId: track.id.toString(),
        bpm: details.bpm || null,
        gain: details.gain || null,
        explicitLyrics: details.explicit_lyrics || false,
        contributors: details.contributors ? details.contributors.map(c => ({
          id: c.id,
          name: c.name,
          role: c.role || 'Artist'
        })) : [],
        rank: track.rank || 0,
        preview: track.preview || null,
        cover: track.album?.cover_xl || track.album?.cover_big || null,
        releaseDate: details.release_date || null
      };
    }
    return null;
  } catch (error) {
    console.error('Deezer enrich error:', error.message);
    return null;
  }
}

// Dohvati artist podatke
async function getDeezerArtist(artistName) {
  try {
    const response = await axios.get('https://api.deezer.com/search/artist', {
      params: { q: artistName, limit: 1 }
    });

    if (response.data.data && response.data.data.length > 0) {
      const artist = response.data.data[0];
      return {
        artistId: artist.id,
        artistName: artist.name,
        artistPicture: artist.picture_xl,
        numberOfFans: artist.nb_fan
      };
    }
    return null;
  } catch (error) {
    console.error('Deezer artist error:', error.message);
    return null;
  }
}

module.exports = {
  enrichWithDeezer,
  getDeezerArtist
};
