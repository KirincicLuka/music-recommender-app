const express = require('express');
const SongSnapshot = require('../models/Songsnapshot');

const router = express.Router();

router.get('/24h', async (req, res) => {
  try {
    const snapshotIds = await SongSnapshot
      .distinct('snapshotId');

    if (snapshotIds.length < 2) {
      return res.status(400).json({ error: 'Not enough snapshots' });
    }
    console.log(snapshotIds);
    const latestId = snapshotIds[snapshotIds.length - 1];
    const previousId = snapshotIds[snapshotIds.length - 2];
    console.log(latestId, previousId);

    const [latest, previous] = await Promise.all([
      SongSnapshot.find({ snapshotId: latestId }),
      SongSnapshot.find({ snapshotId: previousId })
    ]);

    const prevMap = new Map(
      previous.map(s => [String(s.songId), s.score])
    );

    let changes = latest
      .map(s => {
        const prev = prevMap.get(String(s.songId));
        if (prev === undefined) return null;

        return {
          songId: s.songId,
          previousScore: prev,
          currentScore: s.score,
          delta: s.score - prev
        };
      })
      .filter(Boolean);

    // 
    const allZero = changes.every(c => c.delta === 0);

    if (allZero) {
      const fallback = latest
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(s => ({
          songId: s.songId,
          currentScore: s.score
        }));
        console.log('All deltas zero, returning fallback popular songs');
        const populatedResult = await SongSnapshot.populate(fallback, {
        path: 'songId'
        });
        return res.json(populatedResult);
    }

    const topDelta = changes
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 5);
    
    const topDeltaIds = new Set(topDelta.map(s => String(s.songId)));

    const topScore = changes
      .filter(s => !topDeltaIds.has(String(s.songId)))
      .sort((a, b) => b.currentScore - a.currentScore)
      .slice(0, 5);

    const result = [...topDelta, ...topScore];
    const populatedResult = await SongSnapshot.populate(result, {
    path: 'songId'
    });
    res.json(populatedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/lastweek', async (req, res) => {
  try {
    const allSnapshotIds = await SongSnapshot
      .distinct('snapshotId');
    const snapshotIds = allSnapshotIds.slice(0, 7);

    if (snapshotIds.length < 2) {
      return res.status(400).json({ error: 'Not enough snapshots' });
    }

    const latestId = snapshotIds[snapshotIds.length - 1];
    const previousId = snapshotIds[0]; 

    const [latest, previous] = await Promise.all([
      SongSnapshot.find({ snapshotId: latestId }),
      SongSnapshot.find({ snapshotId: previousId })
    ]);

    const prevMap = new Map(
      previous.map(s => [String(s.songId), s.score])
    );

    let changes = latest
      .map(s => {
        const prev = prevMap.get(String(s.songId));
        if (prev === undefined) return null;

        return {
          songId: s.songId,
          previousScore: prev,
          currentScore: s.score,
          delta: s.score - prev
        };
      })
      .filter(Boolean);

    // 
    const allZero = changes.every(c => c.delta === 0);

    if (allZero) {
      const fallback = latest
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(s => ({
          songId: s.songId,
          currentScore: s.score
        }));
        const populatedResult = await SongSnapshot.populate(fallback, {
        path: 'songId'
        });
        return res.json(populatedResult);
    }

    const topDelta = changes
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 5);
    
    const topDeltaIds = new Set(topDelta.map(s => String(s.songId)));

    const topScore = changes
      .filter(s => !topDeltaIds.has(String(s.songId)))
      .sort((a, b) => b.currentScore - a.currentScore)
      .slice(0, 5);

    const result = [...topDelta, ...topScore];
    const populatedResult = await SongSnapshot.populate(result, {
    path: 'songId'
    });
    res.json(populatedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;