import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';

function Profile({ user }) {
  const [savedSongs, setSavedSongs] = useState([]);

  const handleSongSaved = (song) => {
    setSavedSongs(prev => [...prev, song]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome back, {user.ime}! 👋
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover and save your favorite music
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 backdrop-blur-lg bg-opacity-90">
          <SearchBar userId={user.id} onSongSaved={handleSongSaved} />
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-2">🎧</div>
            <div className="text-3xl font-bold mb-1">Premium</div>
            <div className="text-purple-100">Your Plan</div>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-2">⭐</div>
            <div className="text-3xl font-bold mb-1">Active</div>
            <div className="text-pink-100">Status</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;