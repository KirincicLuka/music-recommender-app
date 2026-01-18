const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const jwtSecret = process.env.SESSION_SECRET || 'dev_secret';

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure' }),
  (req, res) => {
    const payload = {
      id: req.user.id,
      email: req.user.email,
      ime: req.user.ime || req.user.name || req.user.displayName
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
    const redirectUrl = `${clientUrl}/auth/success?token=${token}`;
    res.redirect(redirectUrl);
  }
);

router.get('/facebook',
  passport.authenticate('facebook', {
    scope: ['email', 'public_profile', 'user_likes']
  })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/auth/failure' }),
  (req, res) => {
    const payload = {
      id: req.user.id,
      email: req.user.email,
      ime: req.user.ime || req.user.name || req.user.displayName
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
    const redirectUrl = `${clientUrl}/auth/success?token=${token}`;
    res.redirect(redirectUrl);
  }
);

router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect(clientUrl);
  });
});

router.get('/failure', (req, res) => {
  res.status(401).send('Authentication Failed');
});

module.exports = router;
