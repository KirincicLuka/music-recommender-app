import React, { useState } from 'react';
import API from '../api';

function SongModal({ song, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [enrichedSong, setEnrichedSong] = useState(song);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recsStatus, setRecsStatus] = useState('idle'); 

  const loadRecommendations = async () => {
    if (recommendations.length > 0) {
      setActiveTab('recommendations');
      return;
    }

    setLoadingRecs(true);
    setRecsStatus('loading');

    try {
      const res = await API.get(`/api/songs/recommendations/${enrichedSong._id}`);
      const recs = res.data.recommendations || [];

      if (recs.length === 0) {
        setRecommendations([]);
        setRecsStatus('empty');
        setActiveTab('recommendations');
        return;
      }

      setRecommendations(recs);
      setRecsStatus('loaded');
      setActiveTab('recommendations');
    } catch (err) {
      console.error(err);
      setRecsStatus('error');
      setActiveTab('recommendations');
    } finally {
      setLoadingRecs(false);
    }
  };


  // Helper functions
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
      'happy': '😊', 'sad': '😢', 'chill': '😌', 'energetic': '⚡',
      'melancholic': '💙', 'upbeat': '🎉', 'romantic': '💕', 'angry': '😠', 'party': '🎊'
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
      'HR': '🇭🇷', 'US': '🇺🇸', 'GB': '🇬🇧', 'DE': '🇩🇪', 'JP': '🇯🇵'
    };
    return flags[countryCode] || '🌍';
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isEnriched = enrichedSong.bpm || 
                     enrichedSong.itunesData?.length > 0 || 
                     enrichedSong.lastfmData || 
                     enrichedSong.youtubeData ||
                     enrichedSong.spotifyData;

  const bestCover = enrichedSong.itunesData?.[0]?.artworkUrl600 || 
                    enrichedSong.youtubeData?.thumbnail || 
                    enrichedSong.cover;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="relative">
          <img 
            src={bestCover} 
            alt={enrichedSong.title}
            className="w-full h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all shadow-lg"
          >
            ✕
          </button>

          {/* Title Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              {enrichedSong.explicitLyrics && (
                <span className="bg-red-500 px-2 py-1 rounded text-xs font-bold">🅴</span>
              )}
              {enrichedSong.spotifyData && (
                <span className="bg-green-500 px-2 py-1 rounded text-xs font-bold">Spotify</span>
              )}
              {enrichedSong.youtubeData && (
                <span className="bg-red-600 px-2 py-1 rounded text-xs font-bold">YouTube</span>
              )}
            </div>
            <h2 className="text-3xl font-bold mb-1">{enrichedSong.title}</h2>
            <p className="text-xl text-gray-200">{enrichedSong.artist}</p>
            {enrichedSong.album && (
              <p className="text-sm text-gray-300 mt-1">📀 {enrichedSong.album}</p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-4 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium whitespace-nowrap transition-all ${
              activeTab === 'overview' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('player')}
            className={`px-4 py-2 font-medium whitespace-nowrap transition-all ${
              activeTab === 'player' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ▶️ Player
          </button>
          <button
            onClick={() => setActiveTab('technical')}
            className={`px-4 py-2 font-medium whitespace-nowrap transition-all ${
              activeTab === 'technical' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎛️ Technical
          </button>
          <button
            onClick={() => setActiveTab('regional')}
            className={`px-4 py-2 font-medium whitespace-nowrap transition-all ${
              activeTab === 'regional' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🌍 Regional
          </button>
          <button
            onClick={() => {
              setActiveTab('recommendations');
              loadRecommendations();
            }}
            className={`px-4 py-2 font-medium whitespace-nowrap transition-all ${
              activeTab === 'recommendations'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎯 Similar {recommendations.length > 0 ? `(${recommendations.length})` : ''}
          </button>

        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Badges */}
              {isEnriched && (
                <div className="flex flex-wrap gap-2">
                  {enrichedSong.bpm && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      🎵 {Math.round(enrichedSong.bpm)} BPM
                    </span>
                  )}
                  {getMoodFromTags() && (
                    <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                      {getMoodFromTags()}
                    </span>
                  )}
                  {enrichedSong.lastfmData?.playcount > 0 && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      ▶️ {formatNumber(enrichedSong.lastfmData.playcount)} plays
                    </span>
                  )}
                  {enrichedSong.spotifyData?.popularity && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      🔥 {enrichedSong.spotifyData.popularity}% popular
                    </span>
                  )}
                  {enrichedSong.youtubeData?.viewCount && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      👁️ {formatNumber(enrichedSong.youtubeData.viewCount)} views
                    </span>
                  )}
                </div>
              )}

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {enrichedSong.lastfmData?.playcount > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {formatNumber(enrichedSong.lastfmData.playcount)}
                    </div>
                    <div className="text-xs text-blue-600 uppercase tracking-wide">Last.fm Plays</div>
                  </div>
                )}
                {enrichedSong.lastfmData?.listeners > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                      {formatNumber(enrichedSong.lastfmData.listeners)}
                    </div>
                    <div className="text-xs text-green-600 uppercase tracking-wide">Listeners</div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {enrichedSong.lastfmData?.tags && enrichedSong.lastfmData.tags.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">🏷️ Genres & Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {enrichedSong.lastfmData.tags.map((tag, i) => (
                      <span 
                        key={i} 
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 cursor-pointer transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contributors */}
              {enrichedSong.contributors && enrichedSong.contributors.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">👨‍🎤 Contributors</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {enrichedSong.contributors.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Player Tab */}
          {activeTab === 'player' && (
            <div className="space-y-6">
              {enrichedSong.youtubeData?.videoId ? (
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${enrichedSong.youtubeData.videoId}`}
                    title={enrichedSong.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>
              ) : enrichedSong.preview || enrichedSong.itunesData?.[0]?.previewUrl ? (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-lg">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🎵</div>
                    <p className="text-gray-600">30-second preview</p>
                  </div>
                  <audio controls className="w-full">
                    <source src={enrichedSong.preview || enrichedSong.itunesData[0].previewUrl} type="audio/mpeg" />
                  </audio>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔇</div>
                  <p className="text-gray-500">No preview available</p>
                </div>
              )}
            </div>
          )}

          {/* Technical Tab */}
          {activeTab === 'technical' && (
            <div className="space-y-6">
              
              {/* Spotify Audio Features */}
              {enrichedSong.spotifyData?.audioFeatures && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">🎛️ Spotify Audio Features</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.entries(enrichedSong.spotifyData.audioFeatures).map(([key, value]) => (
                      <div key={key} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                        <div className="text-sm text-gray-600 capitalize mb-2">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {typeof value === 'number' && value < 1 
                            ? `${Math.round(value * 100)}%`
                            : Math.round(value)}
                        </div>
                        {/* Progress bar */}
                        {typeof value === 'number' && value <= 1 && (
                          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                              style={{ width: `${value * 100}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">🎵 Track Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {enrichedSong.bpm && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Tempo (BPM):</span>
                      <strong className="text-gray-900 text-lg">{Math.round(enrichedSong.bpm)}</strong>
                    </div>
                  )}
                  {enrichedSong.duration && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Duration:</span>
                      <strong className="text-gray-900 text-lg">{formatDuration(enrichedSong.duration)}</strong>
                    </div>
                  )}
                  {enrichedSong.releaseDate && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Release Date:</span>
                      <strong className="text-gray-900 text-lg">
                        {new Date(enrichedSong.releaseDate).toLocaleDateString()}
                      </strong>
                    </div>
                  )}
                  {enrichedSong.genre && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Genre:</span>
                      <strong className="text-gray-900 text-lg">{enrichedSong.genre}</strong>
                    </div>
                  )}
                </div>
              </div>

              {!enrichedSong.spotifyData && !enrichedSong.bpm && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎛️</div>
                  <p className="text-gray-500">No technical data available</p>
                </div>
              )}
            </div>
          )}

          {/* Regional Tab */}
          {activeTab === 'regional' && (
            <div className="space-y-6">
              {enrichedSong.itunesData && enrichedSong.itunesData.length > 0 ? (
                <>
                  <h4 className="text-lg font-semibold text-gray-800">🌍 iTunes Availability</h4>
                  <div className="grid gap-3">
                    {enrichedSong.itunesData.map((itunes, i) => (
                      <div 
                        key={i} 
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <span className="text-4xl">{getCountryFlag(itunes.country)}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{itunes.country}</div>
                          {itunes.trackPrice > 0 && (
                            <div className="text-sm text-gray-600">
                              {itunes.trackPrice} {itunes.currency}
                            </div>
                          )}
                        </div>
                        <a 
                          href={itunes.itunesUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium transition-all"
                        >
                          View →
                        </a>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🌍</div>
                  <p className="text-gray-500">No regional data available</p>
                </div>
              )}
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800">🎯 Similar Songs</h4>

              {recsStatus === 'loading' && (
                <div className="text-center py-12 text-gray-500">⏳ Loading similar songs...</div>
              )}

              {recsStatus === 'empty' && (
                <div className="text-center py-12 text-gray-500">Not found any similar songs.</div>
              )}

              {recsStatus === 'error' && (
                <div className="text-center py-12 text-gray-500">Error while fetching recommendations.</div>
              )}

              {recsStatus === 'loaded' && recommendations.map((rec, i) => (
                <div
                  key={rec._id || i}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg hover:shadow-md transition-all cursor-pointer"
                >
                  <img
                    src={rec.cover || '/placeholder.png'}
                    alt={rec.title}
                    className="w-14 h-14 rounded-lg object-cover"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">
                      {rec.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      {rec.artist}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SongModal;
