const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/failure' }),
  (req, res) => {
    const payload = { id: req.user.id, email: req.user.email, ime: req.user.ime };
    const token = jwt.sign(payload, process.env.SESSION_SECRET || 'dev_secret', { expiresIn: '7d' });
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/success?token=${token}`;
    res.redirect(redirectUrl);
  }
);

router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect(process.env.CLIENT_URL || 'http://localhost:3000');
  });
});

router.get('/failure', (req, res) => {
  res.status(401).send('Authentication Failed');
});
router.get('/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/auth/facebook' }),
  (req, res) => {
    const payload = {
      id: req.user.id,
      email: req.user.email,
      ime: req.user.ime
    };

    const token = jwt.sign(
      payload,
      process.env.SESSION_SECRET || 'dev_secret',
      { expiresIn: '7d' }
    );

    const redirectUrl =
      `${process.env.CLIENT_URL}/auth/success?token=${token}`;

    res.redirect(redirectUrl);
  }
);

module.exports = router;
