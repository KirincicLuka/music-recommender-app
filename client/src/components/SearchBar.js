import React, { useState } from 'react';
import API from '../api';

function SearchBar({ userId, onSongSaved }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await API.get(`/api/songs/search?q=${encodeURIComponent(query)}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddToFavorite = async (song) => {
    try {
      await API.post('/api/songs/favorite', {
        userId: userId,  
        songId: song._id 
      });
      
      alert('Song added to favorites!');
      onSongSaved(song); 
      
    } catch (err) {
      console.error(err);
      if (err.response?.data?.error === 'Song already in favorites') {
        alert('This song is already in your favorites!');
      } else {
        alert('Failed to add song to favorites!');
      }
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-4 mb-8">
        <input 
          type="text" 
          placeholder="Search by title or artist..." 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 px-6 py-4 rounded-xl bg-white/90 backdrop-blur-sm border-2 border-white/50 focus:border-white focus:outline-none text-gray-800 placeholder-gray-500 text-lg shadow-lg"
        />
        <button 
          onClick={handleSearch} 
          disabled={loading}
          className="px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {results.map(song => (
              <div 
                key={song._id} 
                className="bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-750 transition-all cursor-pointer group"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img 
                    src={song.cover || 'https://via.placeholder.com/300'} 
                    alt={song.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="p-4">
                  <h4 className="font-semibold text-white mb-1 truncate text-sm">
                    {song.title}
                  </h4>
                  <p className="text-gray-400 text-xs mb-3 truncate">
                    {song.artist}
                  </p>

                  <audio 
                    controls 
                    src={song.preview} 
                    className="w-full mb-3 h-8"
                    style={{ filter: 'invert(1) hue-rotate(180deg)' }}
                  />

                  <button 
                    onClick={() => handleAddToFavorite(song)}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    ⭐ Add to Favorites
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && !query && (
        <div className="text-center py-12 text-white">
          <p className="text-xl opacity-90">Search for your favorite songs above</p>
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div className="text-center py-12 text-white">
          <div className="text-6xl mb-4">🎵</div>
          <p className="text-xl opacity-90">No results found. Try a different search!</p>
        </div>
      )}
    </div>
  );
}

export default SearchBar;