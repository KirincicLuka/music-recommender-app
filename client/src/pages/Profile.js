import React, { useEffect, useMemo, useState } from 'react';
import SearchBar from '../components/SearchBar';

// Mali helper: animacija brojanja do targeta
function useCountUp(target, durationMs = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const to = Number(target ?? 0);
    if (!Number.isFinite(to)) return;

    let rafId = null;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
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
  return (
    <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg border border-white/60 hover:shadow-xl transition-shadow">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow">
          {icon}
        </div>

        <div className="flex-1">
          <div className="text-sm text-gray-500">{label}</div>
          <div className="text-3xl font-extrabold tracking-tight text-gray-900">
            {loading ? '—' : value.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function Profile({ user }) {
  const [savedSongs, setSavedSongs] = useState([]);

  const [stats, setStats] = useState({ users: 0, songs: 0, favorites: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const handleSongSaved = (song) => {
    setSavedSongs((prev) => [...prev, song]);
  };

  // Fetch statistika iz baze
  useEffect(() => {
    let alive = true;

    async function loadStats() {
      try {
        setStatsLoading(true);
        const res = await fetch('http://localhost:4000/api/stats', {
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to load stats');
        const data = await res.json();
        if (alive) setStats(data);
      } catch (e) {
        // fallback: ostavi na 0 (ili možeš pokazat toast)
        console.error(e);
      } finally {
        if (alive) setStatsLoading(false);
      }
    }

    loadStats();
    return () => {
      alive = false;
    };
  }, []);

  // Animirani brojevi
  const usersCount = useCountUp(stats.users, 1000);
  const songsCount = useCountUp(stats.songs, 1100);
  const favsCount = useCountUp(stats.favorites, 1200);

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

        {/* Stats (kao na slici) */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon="🎵"
            label="Songs in database"
            value={songsCount}
            loading={statsLoading}
          />
          <StatCard
            icon="👥"
            label="Users"
            value={usersCount}
            loading={statsLoading}
          />
          <StatCard
            icon="❤️"
            label="Favorites total"
            value={favsCount}
            loading={statsLoading}
          />
        </div>

        {/* Tvoj postojeći “Stats Section” (Premium/Active) */}
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
