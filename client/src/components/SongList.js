import React, { useEffect, useState } from 'react';
import API from '../api';
import SongCard from './SongCard';

function SongList({ userId }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dohvati FAVORITE pjesme korisnika
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/api/songs/favorites/${userId}`);
        // res.data je array Favorite dokumenata sa populated 'song' poljem
        const favoriteSongs = res.data.map(fav => ({
          ...fav.song,
          favoriteId: fav._id // Spremi favoriteId za brisanje
        }));
        setSongs(favoriteSongs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [userId]);

  const handleDelete = async (favoriteId) => {
    try {
      await API.delete(`/api/songs/favorite/${favoriteId}`);
      setSongs(prev => prev.filter(song => song.favoriteId !== favoriteId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-4"></div>
        <p className="text-white text-lg">Loading your songs...</p>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="bg-gray-900 rounded-2xl p-12 text-center shadow-2xl">
        <div className="text-8xl mb-6">🎵</div>
        <h3 className="text-3xl font-bold text-white mb-4">No songs yet!</h3>
        <p className="text-gray-400 text-lg mb-6">
          Start building your collection by searching and saving your favorite songs.
        </p>
        <a 
          href="/" 
          className="inline-block bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg"
        >
          Start Searching
        </a>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {songs.map(song => (
          <SongCard 
            key={song.favoriteId} 
            song={song} 
            favoriteId={song.favoriteId}
            onDelete={handleDelete} 
          />
        ))}
      </div>
    </div>
  );
}

export default SongList;