const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id;
      let user = await User.findOne({ googleId });
      if (user) return done(null, user);

      const givenName = profile.name?.givenName || '';
      const familyName = profile.name?.familyName || '';
      const email = profile.emails?.[0]?.value || '';
      const avatar = profile.photos?.[0]?.value || '';

      user = await User.create({
        googleId,
        ime: givenName,
        prezime: familyName,
        email,
        avatar
      });
      return done(null, user);
    } catch (err) {
      console.error('Passport Google Error:', err);
      return done(err, null);
    }
  }));

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
