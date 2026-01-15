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

  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-750 transition-all cursor-pointer group">
      <div className="relative aspect-square overflow-hidden">
        <img 
          src={song.cover || 'https://via.placeholder.com/300'} 
          alt={song.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg disabled:opacity-50 text-xs"
        >
          {isDeleting ? '⏳' : '✕'}
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 truncate text-sm">
          {song.title}
        </h3>
        <p className="text-gray-400 text-xs mb-3 truncate">
          {song.artist}
        </p>

        <audio 
          controls 
          src={song.preview} 
          className="w-full mb-3 h-8"
          style={{ filter: 'invert(1) hue-rotate(180deg)' }}
        />
      </div>
    </div>
  );
}

export default SongCard;