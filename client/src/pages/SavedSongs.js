import React from 'react';
import SongList from '../components/SongList';

function SavedSongs({ user }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 backdrop-blur-lg bg-opacity-90">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                My Saved Songs 🎵
              </h2>
              <p className="text-gray-600 text-lg">Your personal music collection</p>
            </div>
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-3 rounded-2xl shadow-lg">
              <div className="text-sm font-semibold">Total Songs</div>
              <div className="text-3xl font-bold">∞</div>
            </div>
          </div>
        </div>

        <SongList userId={user.id} />
      </div>
    </div>
  );
}

export default SavedSongs;