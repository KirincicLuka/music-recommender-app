const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('FACEBOOK_APP_ID:', process.env.FACEBOOK_APP_ID);

module.exports = function (passport) {

  /* ───────────────── GOOGLE STRATEGY ───────────────── */

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (!user) {
            user = await User.create({
              googleId: profile.id,
              ime: profile.name?.givenName || '',
              prezime: profile.name?.familyName || '',
              email: profile.emails?.[0]?.value || '',
              avatar: profile.photos?.[0]?.value || '',
            });
          }

          return done(null, user);
        } catch (err) {
          console.error('Google auth error:', err);
          return done(err, null);
        }
      }
    )
  );

  /* ───────────────── FACEBOOK STRATEGY ───────────────── */

  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: '/auth/facebook/callback',
        profileFields: ['id', 'displayName', 'emails', 'photos'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ facebookId: profile.id });

          if (!user) {
            user = await User.create({
              facebookId: profile.id,
              username: profile.displayName,
              email: profile.emails?.[0]?.value || '',
              avatar: profile.photos?.[0]?.value || '',
            });
          }

          return done(null, user);
        } catch (err) {
          console.error('Facebook auth error:', err);
          return done(err, null);
        }
      }
    )
  );

  /* ───────────────── SESSION HANDLING ───────────────── */

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};