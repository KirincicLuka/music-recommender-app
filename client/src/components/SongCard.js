import React, { useState, useRef, useEffect } from 'react';
import API from '../api';
import SongModal from './SongModal';

function SongCard({ song, favoriteId, onDelete, onAdd, added = false, showRemove = true }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentSong, setCurrentSong] = useState(song);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handleDelete = async (e) => {
    e.stopPropagation();
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

  const handleAdd = async (e) => {
    e.stopPropagation();
    if (!onAdd) return;
    try {
      await onAdd(currentSong._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCardClick = async () => {
    try {
      API.post(`/api/songs/${currentSong._id}/view`).catch(err => {
        console.error('Failed to track view:', err);
      });
    } catch (err) {
      console.error('View tracking error:', err);
    }
    
    setShowModal(true);
  };

  const togglePlay = (e) => {
    e.stopPropagation(); 
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    e.stopPropagation(); 
    const audio = audioRef.current;
    const seekTime = (e.target.value / 100) * duration;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleUpdateSong = (updatedSong) => {
    setCurrentSong(updatedSong);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const bestCover = currentSong.itunesData?.[0]?.artworkUrl600 || 
                    currentSong.youtubeData?.thumbnail || 
                    currentSong.cover;

  const isEnriched = currentSong.bpm || 
                     currentSong.itunesData?.length > 0 || 
                     currentSong.lastfmData || 
                     currentSong.youtubeData ||
                     currentSong.spotifyData;

  const previewUrl = currentSong.preview || currentSong.itunesData?.[0]?.previewUrl;
  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden cursor-pointer group"
      >
        {/* Image */}
        <div className="relative">
          <img 
            src={bestCover} 
            alt={currentSong.title}
            className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
            <span className="text-white text-5xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              🎵
            </span>
          </div>

          {/* Data badges */}
          {isEnriched && (
            <div className="absolute top-2 left-2 flex gap-1">
              {currentSong.spotifyData && (
                <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">🎵</span>
              )}
              {currentSong.youtubeData && (
                <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">▶️</span>
              )}
              {currentSong.itunesData?.length > 0 && (
                <span className="bg-gray-700 text-white px-2 py-1 rounded text-xs font-bold">🍎</span>
              )}
            </div>
          )}

          {currentSong.explicitLyrics && (
            <span className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm font-bold">
              🅴
            </span>
          )}
        </div>

        <div className="p-4">
          {/* Info */}
          <div className="mb-3">
            <h3 className="text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-blue-600 transition-colors">
              {currentSong.title}
            </h3>
            <p className="text-gray-600 truncate text-sm">{currentSong.artist}</p>
          </div>

          {/* Audio Player (ako ima preview) */}
          {previewUrl && (
            <div className="mb-3 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-3" onClick={(e) => e.stopPropagation()}>
              <audio ref={audioRef} src={previewUrl} preload="metadata" />
              
              <div className="flex items-center gap-2 mb-2">
                {/* Play/Pause Button */}
                <button 
                  onClick={togglePlay}
                  className="w-8 h-8 flex-shrink-0 bg-white text-gray-900 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                >
                  {isPlaying ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Time */}
                <span className="text-xs text-white flex-shrink-0">
                  {formatTime(currentTime)}
                </span>

                {/* Progress Bar */}
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progressPercentage}
                    onChange={handleSeek}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercentage}%, #4b5563 ${progressPercentage}%, #4b5563 100%)`
                    }}
                  />
                </div>

                {/* Duration */}
                <span className="text-xs text-white flex-shrink-0">
                  {formatTime(duration)}
                </span>

                {/* Three dots menu */}
                <button className="w-6 h-6 flex items-center justify-center hover:bg-gray-700 rounded transition-colors text-white">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          {isEnriched && (
            <div className="flex flex-wrap gap-2 mb-3">
              {Number.isFinite(currentSong.popularity) && (
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  ⭐ {currentSong.popularity}
                </span>
              )}
              {currentSong.bpm && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {Math.round(currentSong.bpm)} BPM
                </span>
              )}
              {currentSong.lastfmData?.playcount > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  ▶️ {currentSong.lastfmData.playcount >= 1000000 
                    ? `${(currentSong.lastfmData.playcount / 1000000).toFixed(1)}M` 
                    : `${(currentSong.lastfmData.playcount / 1000).toFixed(0)}K`}
                </span>
              )}
              {currentSong.spotifyData?.popularity && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  🔥 {currentSong.spotifyData.popularity}%
                </span>
              )}
            </div>
          )}

          {/* Action button */}
          {onAdd ? (
            <button
              onClick={handleAdd}
              disabled={added}
              className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-lg font-medium transition-all disabled:cursor-not-allowed text-sm"
            >
              {added ? '✅ Added' : '➕ Add to favorites'}
            </button>
          ) : (showRemove && favoriteId && onDelete) ? (
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg font-medium transition-all disabled:cursor-not-allowed text-sm"
            >
              {isDeleting ? '⏳ Deleting...' : '🗑️ Remove'}
            </button>
          ) : null}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <SongModal 
          song={currentSong} 
          onClose={() => setShowModal(false)}
          onUpdate={handleUpdateSong}
        />
      )}

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
        }
        input[type="range"]:hover::-webkit-slider-thumb {
          opacity: 1;
        }
        input[type="range"]::-moz-range-thumb {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          opacity: 0;
          transition: opacity 0.2s;
        }
        input[type="range"]:hover::-moz-range-thumb {
          opacity: 1;
        }
      `}</style>
    </>
  );
}

export default SongCard;
