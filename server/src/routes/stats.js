const router = require('express').Router();
const User = require('../models/User');
const Song = require('../models/Song');
const Favorite = require('../models/Favorite');

router.get('/', async (req, res) => {
  try {
    const [users, songs, favorites] = await Promise.all([
      User.countDocuments(),
      Song.countDocuments(),
      Favorite.countDocuments()
    ]);

    res.json({ users, songs, favorites });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
