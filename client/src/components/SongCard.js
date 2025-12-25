import React, { useState } from 'react';
import API from '../api';

function SongCard({ song, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this song?')) return;
    
    setIsDeleting(true);
    try {
      await API.delete(`/api/songs/${song._id}`);
      onDelete(song._id);
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:-translate-y-2">
      <div className="relative overflow-hidden aspect-square">
        <img 
          src={song.cover || 'https://via.placeholder.com/300'} 
          alt={song.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg disabled:opacity-50"
        >
          {isDeleting ? '⏳' : '🗑️'}
        </button>
      </div>

      <div className="p-5">
        <h3 className="font-bold text-xl mb-1 text-gray-800 truncate group-hover:text-indigo-600 transition-colors">
          {song.title}
        </h3>
        <p className="text-gray-600 text-sm mb-2 truncate">
          {song.artist}
        </p>
        <p className="text-gray-400 text-xs mb-4 truncate">
          {song.album}
        </p>

        <audio 
          controls 
          src={song.preview} 
          className="w-full mb-4 h-9 rounded-lg"
        />

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

      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
    </div>
  );
}

export default SongCard;