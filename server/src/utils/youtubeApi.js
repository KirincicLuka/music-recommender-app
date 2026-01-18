const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", "..", ".env"),
});
const axios = require("axios");
const mongoose = require("mongoose");
const Song = require("../models/Song");

const { pipeline } = require("@xenova/transformers");

const YT_BASE = "https://www.googleapis.com/youtube/v3";
const MAX_COMMENTS = 20;

async function searchYoutubeVideo(title, artist) {
  const query = `${title} ${artist} official music video`;
  try {
    const res = await axios.get(`${YT_BASE}/search`, {
    params: {
      key: process.env.YOUTUBE_API_KEY,
      q: query,
      part: "snippet",
      type: "video",
      videoCategoryId: 10,
      maxResults: 1,
    },
  });
  return res.data.items[0]?.id?.videoId || null;
  } catch (err) {
    console.warn(`⚠️ Could not search YouTube for "${query}":`, err.response?.data?.error || err.message);
    return null;
  }
}
async function getVideoStats(videoId) {
  const res = await axios.get(`${YT_BASE}/videos`, {
    params: {
      key: process.env.YOUTUBE_API_KEY,
      id: videoId,
      part: "statistics",
    },
  });

  const stats = res.data.items[0]?.statistics;
  if (!stats) return null;

  return {
    views: Number(stats.viewCount || 0),
    likes: Number(stats.likeCount || 0),
    commentCount: Number(stats.commentCount || 0),
  };
}

async function getComments(videoId) {
  try {
    const res = await axios.get(`${YT_BASE}/commentThreads`, {
      params: {
        key: process.env.YOUTUBE_API_KEY,
        videoId,
        part: "snippet",
        maxResults: MAX_COMMENTS,
        textFormat: "plainText",
      },
    });
    return res.data.items.map(
      (i) => i.snippet.topLevelComment.snippet.textDisplay
    );
  } catch (err) {
    console.warn(`⚠️ Could not fetch comments for ${videoId}:`, err.response?.data?.error || err.message);
    return []; 
  }
}

async function analyzeSentiment(comments, classifier) {
  let positive = 0;
  let negative = 0;
  let neutral = 0;

  for (const text of comments) {
    const result = await classifier(text);
    const label = result[0].label;

    if (label === "POSITIVE") positive++;
    else if (label === "NEGATIVE") negative++;
    else neutral++;
  }

  const total = positive + negative + neutral || 1;
  const score = (positive - negative) / total;

  return {
    positive,
    negative,
    neutral,
    score: Number(score.toFixed(3)),
  };
}

async function run() {

  await mongoose.connect(process.env.MONGODB_URI);

  const classifier = await pipeline(
    "sentiment-analysis",
    "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
  );

  const songs = await Song.find({
    "youtubeData.views": { $exists: false },
    deezerId: { $exists: true, $ne: null },
  });

  for (const song of songs) {

    const videoId = await searchYoutubeVideo(song.title, song.artist);
    if (!videoId) {
      console.log("No YouTube video found");
      continue;
    }

    const stats = await getVideoStats(videoId);
    if (!stats) continue;

    const comments = await getComments(videoId);
    const sentiment = await analyzeSentiment(comments, classifier);

    song.youtubeData = {
      videoId,
      views: stats.views,
      likes: stats.likes,
      commentCount: stats.commentCount,
      sentiment,
      fetchedAt: new Date(),
    };

    await song.save();

    await new Promise((r) => setTimeout(r, 600));
  }

  console.log("Job finished");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Job failed", err);
  process.exit(1);
});