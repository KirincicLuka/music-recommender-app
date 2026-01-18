import React, { useEffect, useMemo, useState } from 'react';
import API from '../api';
import SongCard from './SongCard';

function SongList({ userId, songs: songsProp = null, mode = 'auto', onSongSaved }) {

  const shouldFetchFavorites = useMemo(() => {
    if (mode === 'favorites') return true;
    if (mode === 'list') return false;
    return !Array.isArray(songsProp);
  }, [mode, songsProp]);

  const [songs, setSongs] = useState(Array.isArray(songsProp) ? songsProp : []);
  const [loading, setLoading] = useState(shouldFetchFavorites);
  const [addedIds, setAddedIds] = useState(() => new Set());

  useEffect(() => {
    if (Array.isArray(songsProp)) {
      setSongs(songsProp);
      setLoading(false);
    }
  }, [songsProp]);

  useEffect(() => {
    if (!shouldFetchFavorites) return;
    if (!userId) return;

    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/api/songs/favorites/${userId}`);

        const favoriteSongs = res.data.map(fav => ({
          ...fav.song,
          favoriteId: fav._id
        }));

        setSongs(favoriteSongs);
      } catch (err) {
        console.error(err);
        setSongs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [shouldFetchFavorites, userId]);

  const handleDelete = async (favoriteId) => {
    try {
      await API.delete(`/api/songs/favorite/${favoriteId}`);
      setSongs(prev => prev.filter(song => song.favoriteId !== favoriteId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (songId) => {
    try {
      await API.post('/api/songs/favorite', { userId, songId });
      setAddedIds(prev => {
        const next = new Set(prev);
        next.add(String(songId));
        return next;
      });
      if (onSongSaved) onSongSaved();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || 'Greška pri dodavanju u favorite');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-4"></div>
        <p className="text-white text-lg">Loading songs...</p>
      </div>
    );
  }

  if (!songs || songs.length === 0) {
    return (
      <div className="bg-gray-900 rounded-2xl p-12 text-center shadow-2xl">
        <div className="text-8xl mb-6">🎵</div>
        <h3 className="text-3xl font-bold text-white mb-4">No songs yet!</h3>
        <p className="text-gray-400 text-lg mb-6">
          {shouldFetchFavorites
            ? 'Start building your collection by searching and saving your favorite songs.'
            : 'No recommendations available yet.'}
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
        {songs.map(song => {
          const isFavMode = shouldFetchFavorites;
          const isAdded = addedIds.has(String(song._id));

          return (
            <SongCard
              key={song.favoriteId || song._id || `${song.title}-${song.artist}`}
              song={song}
              favoriteId={isFavMode ? song.favoriteId : undefined}
              onDelete={isFavMode ? handleDelete : undefined}
              onAdd={!isFavMode ? handleAdd : undefined}
              added={!isFavMode ? isAdded : false}
              showRemove={isFavMode}
            />
          );
        })}
      </div>
    </div>
  );
}

export default SongList;
