import React, { useState, useEffect } from 'react';
import API from '../api';

function SongCard({ song, favoriteId, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [enrichedSong, setEnrichedSong] = useState(song);

  // Ažuriraj enrichedSong kada se song prop promijeni
  useEffect(() => {
    setEnrichedSong(song);
  }, [song]);

  // DEBUG - provjeri podatke
  useEffect(() => {
    console.log('🎵 Song data:', {
      title: song.title,
      hasBpm: !!enrichedSong.bpm,
      hasItunes: !!enrichedSong.itunesData?.length,
      hasLastfm: !!enrichedSong.lastfmData,
      lastfmPlaycount: enrichedSong.lastfmData?.playcount,
      lastfmListeners: enrichedSong.lastfmData?.listeners,
      fullData: enrichedSong
    });
  }, [enrichedSong]);

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

  const handleEnrich = async () => {
  setIsEnriching(true);
  try {
    console.log('🔄 Enriching song:', enrichedSong._id);
    const res = await API.post(`/api/songs/enrich/${enrichedSong._id}`);
    console.log('✅ Enrich response:', res.data);
    
    // Ažuriraj state umjesto reload-a
    setEnrichedSong(res.data.song);
    
    alert(`✅ Song enriched!\nDeezer: ${res.data.enrichedWith.deezer ? '✓' : '✗'}\niTunes: ${res.data.enrichedWith.itunes ? '✓' : '✗'}\nLast.fm: ${res.data.enrichedWith.lastfm ? '✓' : '✗'}`);
    
    // NE RELOAD - samo postavi showDetails na true da odmah vidi podatke
    setShowDetails(true);
    
  } catch (err) {
    console.error('❌ Enrich error:', err);
    alert('Failed to enrich song. Try again later.');
  } finally {
    setIsEnriching(false);
  }
};


  const loadRecommendations = async () => {
    if (recommendations.length > 0) {
      setRecommendations([]);
      return;
    }

    setLoadingRecs(true);
    try {
      console.log('🔍 Loading recommendations for:', enrichedSong._id);
      const res = await API.get(`/api/songs/recommendations/${enrichedSong._id}`);
      console.log('📊 Recommendations response:', res.data);
      
      setRecommendations(res.data.recommendations || []);
      
      if (res.data.recommendations.length === 0) {
        alert('No recommendations found. Try enriching the song first!');
      }
    } catch (err) {
      console.error('❌ Recommendations error:', err);
      alert('Failed to load recommendations');
    } finally {
      setLoadingRecs(false);
    }
  };

  // Helper funkcije
  const formatNumber = (num) => {
    if (!num) return '0';
    const n = Number(num);
    if (isNaN(n)) return '0';
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  const getMoodFromTags = () => {
    if (!enrichedSong.lastfmData?.tags || enrichedSong.lastfmData.tags.length === 0) return null;
    const moodTags = {
      'happy': '😊',
      'sad': '😢', 
      'chill': '😌',
      'energetic': '⚡',
      'melancholic': '💙',
      'upbeat': '🎉',
      'romantic': '💕',
      'angry': '😠',
      'party': '🎊'
    };
    
    for (const tag of enrichedSong.lastfmData.tags) {
      const tagLower = tag.toLowerCase();
      for (const [mood, emoji] of Object.entries(moodTags)) {
        if (tagLower.includes(mood)) {
          return `${emoji} ${mood}`;
        }
      }
    }
    return null;
  };

  const getCountryFlag = (countryCode) => {
    const flags = {
      'HR': '🇭🇷',
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'DE': '🇩🇪',
      'JP': '🇯🇵'
    };
    return flags[countryCode] || '🌍';
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isEnriched = enrichedSong.bpm || enrichedSong.itunesData?.length > 0 || enrichedSong.lastfmData;
  const bestCover = enrichedSong.itunesData?.[0]?.artworkUrl600 || enrichedSong.cover;
  const previewUrl = enrichedSong.preview || enrichedSong.itunesData?.[0]?.previewUrl;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-5 mb-5">
      
      {/* Image Section */}
      <div className="relative mb-4">
        <img 
          src={bestCover} 
          alt={enrichedSong.title}
          className="w-full aspect-square object-cover rounded-lg"
        />
        {enrichedSong.explicitLyrics && (
          <span className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-bold">
            🅴
          </span>
        )}
      </div>

      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
          {enrichedSong.title}
        </h3>
        <p className="text-gray-600 mb-1">{enrichedSong.artist}</p>
        {enrichedSong.album && (
          <p className="text-sm text-gray-500">📀 {enrichedSong.album}</p>
        )}
      </div>

      {/* Badges */}
      {isEnriched && (
        <div className="flex flex-wrap gap-2 mb-4">
          {enrichedSong.bpm && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              🎵 {Math.round(enrichedSong.bpm)} BPM
            </span>
          )}
          {getMoodFromTags() && (
            <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">
              {getMoodFromTags()}
            </span>
          )}
          {enrichedSong.lastfmData?.playcount > 0 && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              ▶️ {formatNumber(enrichedSong.lastfmData.playcount)}
            </span>
          )}
          {enrichedSong.lastfmData?.listeners > 0 && (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
              👥 {formatNumber(enrichedSong.lastfmData.listeners)}
            </span>
          )}
        </div>
      )}

      {/* Audio Player */}
      <div className="mb-4">
        {previewUrl ? (
          <audio controls className="w-full h-10">
            <source src={previewUrl} type="audio/mpeg" />
            Your browser does not support audio playback.
          </audio>
        ) : (
          <p className="text-center py-3 bg-gray-100 rounded-lg text-gray-500 text-sm">
            🔇 Preview not available
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button 
          onClick={handleDelete} 
          disabled={isDeleting}
          className="flex-1 min-w-[120px] px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed"
        >
          {isDeleting ? '⏳ Deleting...' : '🗑️ Delete'}
        </button>

        {/* UVIJEK prikaži Enrich button */}
        <button 
          onClick={handleEnrich} 
          disabled={isEnriching}
          className="flex-1 min-w-[120px] px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed"
        >
          {isEnriching ? '⏳ Loading...' : isEnriched ? '🔄 Re-enrich' : '✨ Enrich Data'}
        </button>

        {/* UVIJEK prikaži Show Details ako postoje BILO KAKVI podaci */}
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="flex-1 min-w-[120px] px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md"
        >
          {showDetails ? '👁️ Hide Details' : '👁️ Show Details'}
        </button>

        {/* UVIJEK prikaži Similar Songs button */}
        <button 
          onClick={loadRecommendations}
          disabled={loadingRecs}
          className="flex-1 min-w-[120px] px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-300 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed"
        >
          {loadingRecs ? '⏳ Loading...' : 
           recommendations.length > 0 ? '❌ Hide Similar' : '🎯 Similar Songs'}
        </button>
      </div>

      {/* Detailed Info Section - UVIJEK PRIKAZUJ kada je showDetails true */}
      {showDetails && (
        <div className="bg-gray-50 rounded-lg p-5 mt-4 space-y-5">
          
          {/* Contributors */}
          {enrichedSong.contributors && enrichedSong.contributors.length > 0 && (
            <div>
              <h4 className="text-base font-semibold text-gray-800 mb-3">👨‍🎤 Contributors</h4>
              <ul className="space-y-2">
                {enrichedSong.contributors.map((c, i) => (
                  <li key={i} className="pb-2 border-b border-gray-200 last:border-0">
                    <strong className="text-gray-900">{c.name}</strong>
                    <span className="text-gray-500 text-sm ml-2">({c.role})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Last.fm Tags */}
          {enrichedSong.lastfmData?.tags && enrichedSong.lastfmData.tags.length > 0 && (
            <div>
              <h4 className="text-base font-semibold text-gray-800 mb-3">🏷️ Genres & Tags</h4>
              <div className="flex flex-wrap gap-2">
                {enrichedSong.lastfmData.tags.map((tag, i) => (
                  <span 
                    key={i} 
                    className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* iTunes Regional Data */}
          {enrichedSong.itunesData && enrichedSong.itunesData.length > 0 && (
            <div>
              <h4 className="text-base font-semibold text-gray-800 mb-3">🌍 Regional Availability</h4>
              <div className="space-y-3">
                {enrichedSong.itunesData.map((itunes, i) => (
                  <div 
                    key={i} 
                    className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-lg"
                  >
                    <span className="text-2xl">{getCountryFlag(itunes.country)}</span>
                    <span className="font-semibold text-gray-900 min-w-[40px]">{itunes.country}</span>
                    {itunes.trackPrice > 0 && (
                      <span className="text-gray-600 text-sm">
                        {itunes.trackPrice} {itunes.currency}
                      </span>
                    )}
                    <a 
                      href={itunes.itunesUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-auto text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                    >
                      View on iTunes →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last.fm Stats - UVIJEK prikaži ako postoje */}
          {enrichedSong.lastfmData && (
            <div>
              <h4 className="text-base font-semibold text-gray-800 mb-3">📊 Last.fm Statistics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {formatNumber(enrichedSong.lastfmData.playcount)}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Total Plays</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {formatNumber(enrichedSong.lastfmData.listeners)}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Listeners</div>
                </div>
              </div>
            </div>
          )}

          {/* Technical Info */}
          {(enrichedSong.bpm || enrichedSong.duration || enrichedSong.releaseDate || enrichedSong.genre) && (
            <div>
              <h4 className="text-base font-semibold text-gray-800 mb-3">🎛️ Technical Info</h4>
              <ul className="space-y-2">
                {enrichedSong.bpm && (
                  <li className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Tempo:</span>
                    <strong className="text-gray-900">{Math.round(enrichedSong.bpm)} BPM</strong>
                  </li>
                )}
                {enrichedSong.duration && (
                  <li className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Duration:</span>
                    <strong className="text-gray-900">{formatDuration(enrichedSong.duration)}</strong>
                  </li>
                )}
                {enrichedSong.releaseDate && (
                  <li className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Released:</span>
                    <strong className="text-gray-900">
                      {new Date(enrichedSong.releaseDate).toLocaleDateString()}
                    </strong>
                  </li>
                )}
                {enrichedSong.genre && (
                  <li className="flex justify-between py-2">
                    <span className="text-gray-600">Genre:</span>
                    <strong className="text-gray-900">{enrichedSong.genre}</strong>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Ako nema nikakvih podataka */}
          {!enrichedSong.contributors?.length && 
           !enrichedSong.lastfmData?.tags?.length && 
           !enrichedSong.itunesData?.length && 
           !enrichedSong.lastfmData && 
           !enrichedSong.bpm && 
           !enrichedSong.duration && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No additional data available yet.</p>
              <button 
                onClick={handleEnrich}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
              >
                ✨ Enrich Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recommendations Section */}
{recommendations.length > 0 && (
  <div className="mt-5 pt-5 border-t-2 border-gray-200">
    <h4 className="text-base font-semibold text-gray-800 mb-4">🎯 You might also like:</h4>
    <div className="space-y-3">
      {recommendations.slice(0, 5).map((rec, i) => (
        <div 
          key={rec._id || i} 
          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <img 
            src={rec.cover || `https://via.placeholder.com/150/667eea/ffffff?text=${encodeURIComponent(rec.title.substring(0, 2))}`} 
            alt={rec.title}
            className="w-12 h-12 rounded object-cover flex-shrink-0"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/150/667eea/ffffff?text=♫';
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900 truncate">
              {rec.title}
            </div>
            <div className="text-sm text-gray-600 truncate">
              {rec.artist}
            </div>
            {rec.match && (
              <div className="text-xs text-gray-500 mt-1">
                Match: {Math.round(rec.match * 100)}%
              </div>
            )}
          </div>
          {!rec._id && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              Not in DB
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
)}
    </div>
  );
}

export default SongCard;
