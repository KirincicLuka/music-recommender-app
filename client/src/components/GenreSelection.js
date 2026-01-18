import React, { useState, useEffect } from 'react';
import API from '../api';

function GenreSelection({ user, onComplete, initialGenres, showSkip = true }) {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (typeof initialGenres === 'undefined') return;
    setSelectedGenres(Array.isArray(initialGenres) ? initialGenres : []);
  }, [initialGenres]);
  
  const availableGenres = [
    'Pop', 
    'Rock', 
    'Hip Hop', 
    'R&B',
    'Electronic', 
    'Dance',
    'Jazz', 
    'Classical',
    'Country', 
    'Metal', 
    'Indie',
    'Soul', 
    'Blues', 
    'Reggae', 
    'Folk',
    'Latin',
    'Alternative',
    'Punk',
    'Funk',
    'Gospel'
  ];

  const toggleGenre = (genre) => {
    setSelectedGenres(prev => {
      if (prev.includes(genre)) {
        return prev.filter(g => g !== genre);
      } else {
        return [...prev, genre];
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedGenres.length === 0) {
      alert('PLease choose at least one genre!');
      return;
    }

    setSaving(true);

    try {
      await API.post(`/api/users/${user.id}/preferences`, {
        genres: selectedGenres
      });
      onComplete();
    } catch (err) {
      alert('Failed to save preferences. Try again.');
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!window.confirm('Skip genre selection? You can do it later if you want.')) return;

    setSaving(true);
    try {
      await API.post(`/api/users/${user.id}/preferences`, { genres: [] });
      onComplete();
    } catch (err) {
      console.error('Failed to skip onboarding:', err);
      alert('Error. Try again.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-5">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-4xl w-full">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mb-6">
            <span className="text-7xl">🎵</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-3">
            Welcome, {user.ime || 'user'}!
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Choose music genres you love and we will recommend you best songs
          </p>
        </div>

        {/* Genre Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
          {availableGenres.map(genre => (
            <button
              key={genre}
              onClick={() => toggleGenre(genre)}
              className={`
                px-4 py-4 rounded-xl font-medium text-sm
                transition-all duration-200 transform
                border-2 relative flex items-center justify-center
                ${selectedGenres.includes(genre)
                  ? 'bg-purple-600 border-purple-600 text-white scale-105 shadow-lg'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-purple-400 hover:shadow-md'
                }
              `}
            >
              <span className="mr-2">{genre}</span>
              {selectedGenres.includes(genre) && (
                <span className="text-lg font-bold">✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Selected Count */}
        <div className="text-center mb-8 text-gray-600 text-base">
          Selected: <strong className="text-purple-600 text-lg">{selectedGenres.length}</strong> {selectedGenres.length === 1 ? 'genre' : 'genres'}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving || selectedGenres.length === 0}
            className={`
              w-full py-4 rounded-xl font-bold text-lg
              transition-all duration-200
              ${saving || selectedGenres.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg transform hover:scale-[1.02]'
              }
            `}
          >
            {saving ? (
              <span className="flex items-center justify-center">
                <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></span>
                Saving preferences...
              </span>
            ) : (
              'Continue'
            )}
          </button>

          {showSkip && (
            <button
              onClick={handleSkip}
              disabled={saving}
              className="w-full py-3 text-gray-500 hover:text-gray-700 transition-colors duration-200 text-sm underline"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default GenreSelection;
