import React, { useEffect, useMemo, useState } from 'react';
import API from '../api';
import SongCard from '../components/SongCard';
import Navbar from '../components/Navbar';

function Popular({ user }) {
  const [range, setRange] = useState('24h'); 
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [addedIds, setAddedIds] = useState(() => new Set());

  const title = useMemo(() => (range === '24h' ? 'Popular (24h)' : 'Popular (Last week)'), [range]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await API.get(`/api/popular/${range}`);

        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load popular:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [range]);

  const handleAdd = async (songId) => {
    try {
      await API.post('/api/songs/favorite', { userId: user.id, songId });
      setAddedIds(prev => {
        const next = new Set(prev);
        next.add(String(songId));
        return next;
      });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || 'Error while adding to favorites');
    }
  };

  return (
    <><Navbar />
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 backdrop-blur-lg bg-opacity-90">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                {title} 
              </h2>
              <p className="text-gray-600 text-lg">Trending songs based on snapshots and scores</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setRange('24h')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  range === '24h' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                24h
              </button>
              <button
                onClick={() => setRange('lastweek')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  range === 'lastweek' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                Last week
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="text-gray-700 mt-4 text-lg">Loading popular songs...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-12 text-center shadow-2xl text-white">
            <div className="text-8xl mb-6">📈</div>
            <h3 className="text-3xl font-bold mb-4">No popular data yet!</h3>
            <p className="text-gray-300 text-lg">
              You need at least 2 snapshots for comparisons (or snapshot generation).
            </p>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {items.map((row, idx) => {
                const song = row.songId; 
                if (!song) return null;

                const delta = typeof row.delta === 'number' ? row.delta : null;

                return (
                  <div key={`${song._id}-${idx}`} className="space-y-2">
                    <SongCard
                      song={song}
                      onAdd={handleAdd}
                      added={addedIds.has(String(song._id))}
                      showRemove={false}
                    />

                    <div className="flex flex-wrap gap-2">
                      {delta !== null && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          delta >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          Δ {delta >= 0 ? '+' : ''}{Math.round(delta*100)/100}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default Popular;
