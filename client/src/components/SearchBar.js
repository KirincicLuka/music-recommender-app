import React, { useState } from 'react';
import API from '../api';

function SearchBar({ userId, onSongSaved }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ deezer: [], spotify: [], itunes: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, deezer, spotify, itunes

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
      const payload = {
        userId,
        source: song.source,
        externalId: song.externalId,
        name: song.name,
        artist: song.artist,
        album: song.album,
        imageUrl: song.imageUrl,
        previewUrl: song.previewUrl,
        // Dodatni podaci specifični za izvor
        ...(song.spotifyUrl && { spotifyUrl: song.spotifyUrl }),
        ...(song.itunesUrl && { itunesUrl: song.itunesUrl }),
        ...(song.duration && { duration: song.duration }),
        ...(song.releaseDate && { releaseDate: song.releaseDate }),
        ...(song.genre && { genre: song.genre }),
      };
      
      const res = await API.post('/api/songs/save', payload);
      onSongSaved(res.data);
      
      const button = document.querySelector(`[data-song-id="${song.source}-${song.externalId}"]`);
      if (button) {
        button.textContent = '✓ Saved!';
        button.classList.add('bg-green-500');
        setTimeout(() => {
          button.textContent = '💾 Save';
          button.classList.remove('bg-green-500');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.error === 'Song already in favorites') {
        alert('This song is already in your favorites!');
      } else {
        alert('Failed to add song to favorites!');
      }
    }
  };

  // Broji ukupan broj rezultata
  const totalResults = results.deezer.length + results.spotify.length + results.itunes.length;

  // Filtrira rezultate prema aktivnom tabu
  const getFilteredResults = () => {
    if (activeTab === 'all') {
      return [
        ...results.deezer,
        ...results.spotify,
        ...results.itunes,
      ];
    }
    return results[activeTab] || [];
  };

  const filteredResults = getFilteredResults();

  // Funkcija za dobijanje badge boje prema izvoru
  const getSourceBadge = (source) => {
    const badges = {
      deezer: { text: 'Deezer', color: 'bg-purple-500' },
      spotify: { text: 'Spotify', color: 'bg-green-500' },
      itunes: { text: 'iTunes', color: 'bg-blue-500' },
    };
    return badges[source] || { text: source, color: 'bg-gray-500' };
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

      {totalResults > 0 && (
        <div>
          {/* Tabs za filtriranje po izvoru */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2 rounded-full font-semibold transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All ({totalResults})
            </button>
            <button
              onClick={() => setActiveTab('deezer')}
              className={`px-6 py-2 rounded-full font-semibold transition-all whitespace-nowrap ${
                activeTab === 'deezer'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Deezer ({results.deezer.length})
            </button>
            <button
              onClick={() => setActiveTab('spotify')}
              className={`px-6 py-2 rounded-full font-semibold transition-all whitespace-nowrap ${
                activeTab === 'spotify'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Spotify ({results.spotify.length})
            </button>
            <button
              onClick={() => setActiveTab('itunes')}
              className={`px-6 py-2 rounded-full font-semibold transition-all whitespace-nowrap ${
                activeTab === 'itunes'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              iTunes ({results.itunes.length})
            </button>
          </div>

          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            Search Results ({filteredResults.length})
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredResults.map((song, index) => {
              const badge = getSourceBadge(song.source);
              return (
                <div 
                  key={`${song.source}-${song.externalId}-${index}`}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:-translate-y-1"
                >
                  <div className="relative overflow-hidden aspect-square">
                    <img 
                      src={song.imageUrl} 
                      alt={song.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                      }}
                    />
                    {/* Source badge */}
                    <div className={`absolute top-3 right-3 ${badge.color} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg`}>
                      {badge.text}
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300"></div>
                  </div>

                  <div className="p-4">
                    <h4 className="font-bold text-lg mb-1 truncate text-gray-800">
                      {song.name}
                    </h4>
                    <p className="text-gray-600 text-sm mb-3 truncate">
                      {song.artist}
                    </p>

                    {song.previewUrl && (
                      <audio 
                        controls 
                        src={song.previewUrl} 
                        className="w-full mb-3 h-8"
                      />
                    )}

                    <button 
                      onClick={() => handleSave(song)}
                      data-song-id={`${song.source}-${song.externalId}`}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                    >
                      💾 Save
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && totalResults === 0 && query && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎵</div>
          <p className="text-xl opacity-90">No results found. Try a different search!</p>
        </div>
      )}
    </div>
  );
}

export default SearchBar;