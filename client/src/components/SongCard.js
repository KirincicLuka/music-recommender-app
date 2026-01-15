import React, { useState } from 'react';
import API from '../api';

function SongCard({ song, favoriteId, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Remove this song from favorites?')) return;
    
    setIsDeleting(true);
    try {
      await API.delete(`/api/songs/favorite/${favoriteId}`);
      onDelete(favoriteId);
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  // Funkcija za dobijanje badge boje prema izvoru
  const getSourceBadge = (source) => {
    const badges = {
      deezer: { text: 'Deezer', color: 'bg-purple-500' },
      spotify: { text: 'Spotify', color: 'bg-green-500' },
      itunes: { text: 'iTunes', color: 'bg-blue-500' },
      napster: { text: 'Napster', color: 'bg-orange-500' },
    };
    return badges[source] || { text: source, color: 'bg-gray-500' };
  };

  const badge = getSourceBadge(song.source);

  // Podrška za stare i nove nazive polja
  const songName = song.name || song.title;
  const songImage = song.imageUrl || song.cover || 'https://via.placeholder.com/300';
  const songPreview = song.previewUrl || song.preview;

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-750 transition-all cursor-pointer group">
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={songImage} 
          alt={songName} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
          }}
        />
        {/* Source badge */}
        <div className={`absolute top-3 left-3 ${badge.color} text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg`}>
          {badge.text}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg disabled:opacity-50 text-xs"
        >
          {isDeleting ? '⏳' : '✕'}
        </button>
      </div>

      <div className="p-5">
        <h3 className="font-bold text-xl mb-1 text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
          {songName}
        </h3>
        <p className="text-gray-400 text-xs mb-3 truncate">
          {song.artist}
        </p>
        <p className="text-gray-400 text-xs mb-4 truncate">
          {song.album || 'Unknown Album'}
        </p>

        {songPreview && (
          <audio 
            controls 
            src={songPreview} 
            className="w-full mb-4 h-9 rounded-lg"
          />
        )}

        <div className="flex gap-2">
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : '🗑️ Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SongCard;