import React from 'react';

function PreferencesDisplay({ user }) {
  if (!user) {
    return (
      <div className="bg-gray-100 p-6 rounded-2xl text-center">
        <p className="text-gray-500">Loading user preferences...</p>
      </div>
    );
  }

  const indirectGenres = user.indirectPreferences?.detectedGenres || [];
  const detectedArtists = user.indirectPreferences?.detectedArtists || [];
  const source = user.indirectPreferences?.source;
  const detectedAt = user.indirectPreferences?.detectedAt;

  return (
    <div className="space-y-6">

      {(indirectGenres.length > 0 || detectedArtists.length > 0) && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl border-2 border-blue-200">
          <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            Auto-Detected from {source === 'facebook' ? 'Facebook' : 'Profile'}
          </h3>
          
          {detectedAt && (
            <p className="text-xs text-gray-500 mb-3">
              Detected on: {new Date(detectedAt).toLocaleDateString()}
            </p>
          )}

          {indirectGenres.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Genres:</h4>
              <div className="flex flex-wrap gap-2">
                {indirectGenres.map((genre) => (
                  <span
                    key={genre}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium shadow-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {detectedArtists.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Artists you like ({detectedArtists.length}):
              </h4>
              <div className="flex flex-wrap gap-2">
                {detectedArtists.slice(0, 10).map((artist) => (
                  <span
                    key={artist}
                    className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-medium"
                  >
                    🎤 {artist}
                  </span>
                ))}
                {detectedArtists.length > 10 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                    +{detectedArtists.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-xs text-blue-800">
              💡 <strong>Tip:</strong> These preferences were automatically detected from your {source} profile. 
              You can override them by selecting your own genres above.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

export default PreferencesDisplay;