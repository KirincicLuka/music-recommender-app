import React, { useEffect, useState } from 'react';
import SearchBar from '../components/SearchBar';
import SongList from '../components/SongList';
import API from '../api';
import Navbar from '../components/Navbar';
import GenreSelection from '../components/GenreSelection';

// Helper: animacija brojanja do targeta
function useCountUp(target, durationMs = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const to = Number(target ?? 0);
    if (!Number.isFinite(to)) return;

    let rafId = null;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * to));

      if (progress < 1) rafId = requestAnimationFrame(tick);
    };

    setValue(0);
    rafId = requestAnimationFrame(tick);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [target, durationMs]);

  return value;
}

function StatCard({ icon, label, value, loading }) {
  const animatedValue = useCountUp(value);

  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-white/60 hover:shadow-xl transition-shadow">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow">
          {icon}
        </div>

        <div className="flex-1">
          <div className="text-sm text-gray-500">{label}</div>
          <div className="text-3xl font-extrabold tracking-tight text-gray-900">
            {loading ? '—' : animatedValue.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function Profile({ user }) {
  // Stats state
  const [stats, setStats] = useState({ totalSongs: 0, totalUsers: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // User preferences state
  const [userPreferences, setUserPreferences] = useState(null);
  const [preferencesLoading, setPreferencesLoading] = useState(true);

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsStats, setRecommendationsStats] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  // User favorites count
  const [userFavoritesCount, setUserFavoritesCount] = useState(0);

  const [showGenreModal, setShowGenreModal] = useState(false);

  // Fetch global stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await API.get('/api/songs/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  // Fetch user preferences
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await API.get(`/api/users/${user.id}`);
        setUserPreferences(res.data);
      } catch (err) {
        console.error('Failed to fetch user preferences:', err);
      } finally {
        setPreferencesLoading(false);
      }
    };

    if (user?.id) {
      fetchUserData();
    }
  }, [user]);

  // Fetch user favorites count
  useEffect(() => {
    const fetchUserFavorites = async () => {
      try {
        const res = await API.get(`/api/songs/favorites/${user.id}`);
        setUserFavoritesCount(res.data.length);
      } catch (err) {
        console.error('Failed to fetch user favorites:', err);
      }
    };

    if (user?.id) {
      fetchUserFavorites();
    }
  }, [user]);

  // Fetch recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await API.get(`/api/users/${user.id}/recommendations`);
        setRecommendations(res.data.recommendations || []);
        setRecommendationsStats(res.data.stats);
        console.log('📊 Recommendations stats:', res.data.stats);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    if (user?.id) {
      fetchRecommendations();
    }
  }, [user]);

  const handleSongSaved = async () => {
    // Refresh favorites count
    try {
      const res = await API.get(`/api/songs/favorites/${user.id}`);
      setUserFavoritesCount(res.data.length);
    } catch (err) {
      console.error('Failed to refresh favorites:', err);
    }

    // Refresh recommendations
    setLoadingRecommendations(true);
      try {
        const res = await API.get(`/api/users/${user.id}/recommendations`);
        setRecommendations(res.data.recommendations || []);
        setRecommendationsStats(res.data.stats);
      } catch (err) {
        console.error('Failed to refresh recommendations:', err);
      } finally {
        setLoadingRecommendations(false);
      }
    };

  const handleGenresUpdated = async () => {
  setShowGenreModal(false);

  // refresh preferences
  setPreferencesLoading(true);
  try {
    const res = await API.get(`/api/users/${user.id}`);
    setUserPreferences(res.data);
  } catch (err) {
    console.error('Failed to refresh user preferences:', err);
  } finally {
    setPreferencesLoading(false);
  }

  // refresh recommendations
  setLoadingRecommendations(true);
    try {
      const res = await API.get(`/api/users/${user.id}/recommendations`);
      setRecommendations(res.data.recommendations || []);
      setRecommendationsStats(res.data.stats);
    } catch (err) {
      console.error('Failed to refresh recommendations:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  };


  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            {user.avatar && (
              <img 
                src={user.avatar} 
                alt={user.ime}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
              />
            )}
            <div>
              <h1 className="text-4xl font-bold mb-1">
                Welcome, {user.ime || 'korisniče'}! 👋
              </h1>
              <p className="text-purple-100 text-lg">
                Discover and save your favorite music
              </p>
            </div>
          </div>
        </div>
         {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon="🎵"
            label="Songs in Database"
            value={stats.totalSongs}
            loading={statsLoading}
          />
          <StatCard
            icon="❤️"
            label="Your Saved Songs"
            value={userFavoritesCount}
            loading={statsLoading}
          />
          <StatCard
            icon="🌟"
            label="Total Users"
            value={stats.totalUsers}
            loading={statsLoading}
          />
        </div>
        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-3xl">🔍</span>
            Search songs
          </h3>
          <SearchBar 
            userId={user.id} 
            onSongSaved={handleSongSaved} 
          />
        </div>
        {/* ==================== OVDJE POČINJE RECOMMENDATIONS SEKCIJA ==================== */}
        <div>
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <span className="text-4xl">🎯</span>
              Recommended for you
            </h3>
            {!loadingRecommendations && recommendations.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 bg-purple-100 px-4 py-2 rounded-full font-medium">
                  {recommendations.length} {recommendations.length === 1 ? 'song' : 'songs'}
                </span>
                {recommendationsStats && (
                  <button 
                    onClick={() => {
                      alert(
                        `📊 Breakdown recommendation:\n\n` +
                        `🎸 Genres (${userPreferences?.preferredGenres?.join(', ') || 'N/A'}): ${recommendationsStats.fromGenres}\n` +
                        `🔄 Similar to favorites: ${recommendationsStats.fromFavorites}\n` +
                        `👥 From other users with similar taste in music: ${recommendationsStats.fromCollaborative}\n\n` +
                        `📈 Total: ${recommendationsStats.total} recommendations`
                      );
                    }}
                    className="text-xs text-purple-600 hover:text-purple-800 font-medium underline cursor-pointer"
                  >
                    📊 Statistics
                  </button>
                )}
              </div>
            )}
          </div>
          
          {loadingRecommendations ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
              <p className="text-gray-600 mt-4 text-lg">Loading personal recommendations...</p>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <SongList userId={user.id} songs={recommendations} mode="list" onSongSaved={handleSongSaved} />
            </div>
          ) : (
            <div className="text-center py-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
              <span className="text-6xl mb-4 block">🎵</span>
              <p className="text-gray-700 text-xl font-semibold mb-2">No available recommendations.</p>
              <p className="text-gray-500 text-base max-w-md mx-auto">
                {userPreferences?.preferredGenres?.length > 0 
                  ? 'Save songs and discover more content!'
                  : 'Choose your favorite genres to get music recommendations!'
                }
              </p>
            </div>
          )}
        </div>
        </div>
        {/* ==================== OVDJE ZAVRŠAVA RECOMMENDATIONS SEKCIJA ==================== */}
        {/* User Preferred Genres Section (always visible) */}
        <div className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl border-2 border-purple-200 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">💜</span>
              Your preferred genres
            </h4>

            <button
              onClick={() => setShowGenreModal(true)}
              className="px-4 py-2 rounded-xl font-semibold text-sm bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm"
            >
              {userPreferences?.preferredGenres?.length > 0 ? 'Edit genres' : 'Choose genres'}
            </button>
          </div>

          <div className="mt-4">
            {preferencesLoading ? (
              <p className="text-gray-500">Loading genres...</p>
            ) : userPreferences?.preferredGenres?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userPreferences.preferredGenres.map((genre) => (
                  <span
                    key={genre}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-purple-700 transition-colors"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">
                You haven’t selected any genres yet. Click <strong>Choose genres</strong> to personalize recommendations.
              </p>
            )}
          </div>
        </div>

        {/* Genre modal */}
        {showGenreModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowGenreModal(false)}
            />
            <div className="relative w-full max-w-5xl">
              <GenreSelection
                user={user}
                initialGenres={userPreferences?.preferredGenres || []}
                showSkip={false}
                onComplete={handleGenresUpdated}
              />
            </div>
          </div>
        )}

      </div>
    </div>
    </>
  );
}

export default Profile;
