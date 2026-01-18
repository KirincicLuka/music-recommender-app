const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema(
  {
    deezerId: { type: String, unique: true, required: true },
    title: { type: String, required: true },
    artist: { type: String, required: true },
    album: String,
    preview: String,
    cover: String,
    duration: Number,
    rank: Number,
    releaseDate: String,
    genre: String,
    mood: String,
    lyrics: String,
    musicVideo: String,

    popularity: Number,
    viewCount: {
      type: Number,
      default: 0
    },
    lastViewedAt: {
      type: Date,
      default: null
    },

    bpm: Number,
    gain: Number,
    explicitLyrics: Boolean,
    contributors: [
      {
        id: Number,
        name: String,
        role: String
      }
    ],

    itunesData: {
      type: [
        {
          country: String,
          itunesId: Number,
          itunesUrl: String,
          previewUrl: String,
          artworkUrl600: String,
          trackPrice: Number,
          currency: String,
          collectionName: String,
          discNumber: Number,
          trackNumber: Number,
          isrc: String
        }
      ],
      default: []
    },

    lastfmData: {
      playcount: Number,
      listeners: Number,
      tags: [String],
      mbid: String,
      similarTracks: [
        {
          name: String,
          artist: String,
          match: Number // 0–1
        }
      ]
    },

    youtubeData: {
      videoId: String,
      views: Number,
      likes: Number,
      commentCount: Number,
      sentiment: {
        positive: Number,
        neutral: Number,
        negative: Number,
        score: Number
      },
      fetchedAt: Date
    },

    musicbrainzData: {
      mbid: String,
      rating: {
        value: Number, 
        votes: Number
      },
      releaseGroupId: String
    }
  },
  {
    createdAt: { type: Date, default: Date.now }
  }
);

SongSchema.index({
  title: 'text',
  artist: 'text',
  album: 'text'
});

module.exports = mongoose.model('Song', SongSchema);
