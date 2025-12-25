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

  const handleSave = async (song) => {
    try {
      const payload = {
        userId,
        title: song.title,
        artist: song.artist.name,
        album: song.album.title,
        preview: song.preview,
        cover: song.album.cover_medium || song.album.cover_big || song.album.cover_small
      };
      const res = await API.post('/api/songs/save', payload);
      onSongSaved(res.data);
      
      const button = document.querySelector(`[data-song-id="${song.id}"]`);
      if (button) {
        button.textContent = '✓ Saved!';
        button.classList.add('bg-green-500');
        setTimeout(() => {
          button.textContent = 'Save';
          button.classList.remove('bg-green-500');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save song. It may already be in your library!');
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-3 mb-8">
        <div className="flex-1 relative">
          <input 
            type="text" 
            placeholder="Search for songs, artists, or albums..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-6 py-4 rounded-2xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-all text-lg shadow-sm"
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
        </div>
        <button 
          onClick={handleSearch} 
          disabled={loading}
          className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {results.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            Search Results ({results.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map(song => (
              <div 
                key={song.id} 
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:-translate-y-1"
              >
                <div className="relative overflow-hidden aspect-square">
                  <img 
                    src={song.album.cover_medium} 
                    alt={song.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300"></div>
                </div>

                <div className="p-4">
                  <h4 className="font-bold text-lg mb-1 truncate text-gray-800">
                    {song.title}
                  </h4>
                  <p className="text-gray-600 text-sm mb-3 truncate">
                    {song.artist.name}
                  </p>

                  <audio 
                    controls 
                    src={song.preview} 
                    className="w-full mb-3 h-8"
                  />

                  <button 
                    onClick={() => handleSave(song)}
                    data-song-id={song.id}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    💾 Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎵</div>
          <p className="text-gray-500 text-lg">No results found. Try a different search!</p>
        </div>
      )}
    </div>
  );
}

export default SearchBar;