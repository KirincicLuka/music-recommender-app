import React, { useEffect, useState } from 'react';
import API from '../api';
import SongCard from './SongCard';

function SongList({ userId }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    API.get(`/api/songs/user/${userId}`)
      .then(res => {
        setSongs(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [userId]);

  const handleDelete = (deletedId) => {
    setSongs(prev => prev.filter(song => song._id !== deletedId));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 text-lg">Loading your songs...</p>
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
        <div className="text-8xl mb-6">🎵</div>
        <h3 className="text-3xl font-bold text-gray-800 mb-4">No songs yet!</h3>
        <p className="text-gray-600 text-lg mb-6">
          Start building your collection by searching and saving your favorite songs.
        </p>
        <a 
          href="/" 
          className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          🔍 Start Searching
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm mb-1">Your Library</p>
            <p className="text-3xl font-bold text-gray-800">{songs.length} Songs</p>
          </div>
          <div className="text-5xl">🎶</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {songs.map(song => (
          <SongCard key={song._id} song={song} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}

export default SongList;