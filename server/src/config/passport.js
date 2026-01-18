const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const axios = require('axios');
const User = require('../models/User');

// ========== Helper: dohvat Facebook interesa ==========
async function fetchFacebookInterests(accessToken) {
  const base = 'https://graph.facebook.com/v19.0/me';

  const musicReq = axios
    .get(`${base}/music`, {
      params: { fields: 'name', limit: 50, access_token: accessToken },
    })
    .catch(() => ({ data: { data: [] } }));

  const likesReq = axios
    .get(`${base}/likes`, {
      params: { fields: 'name,category', limit: 50, access_token: accessToken },
    })
    .catch(() => ({ data: { data: [] } }));

  const [musicRes, likesRes] = await Promise.all([musicReq, likesReq]);

  return {
    music: musicRes.data?.data || [],
    likes: likesRes.data?.data || [],
  };
}

// ========== Helper: infer genre iz imena ==========
function inferGenresFromArtists(artists = []) {
  const genreMap = {
    rock: ['rock', 'metal'],
    pop: ['pop'],
    electronic: ['dj', 'electronic', 'edm', 'house', 'techno'],
    hiphop: ['hip hop', 'rap'],
    jazz: ['jazz'],
    classical: ['classical', 'orchestra'],
    latin: ['latin'],
    reggae: ['reggae'],
  };

  const detected = [];

  artists.forEach((name) => {
    const lower = String(name || '').toLowerCase();
    for (const [genre, keywords] of Object.entries(genreMap)) {
      if (keywords.some((k) => lower.includes(k))) detected.push(genre);
    }
  });

  return [...new Set(detected)];
}

// ============================================
// GOOGLE STRATEGY
// ============================================
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
            preferredGenres: [],
            onboardingCompleted: false,
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

// ============================================
// FACEBOOK STRATEGY (indirektne preference)
// ============================================
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'displayName', 'emails'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          $or: [{ facebookId: profile.id }, { email: profile.emails?.[0]?.value }],
        });

        let detectedArtists = [];
        let detectedGenres = [];

        try {
          const { music, likes } = await fetchFacebookInterests(accessToken);

          detectedArtists.push(...music.map((m) => m.name));

          const musicLikes = likes.filter((l) => {
            const c = (l.category || '').toLowerCase();
            return c.includes('music') || c.includes('band') || c.includes('musician');
          });

          detectedArtists.push(...musicLikes.map((l) => l.name));

          detectedArtists = [...new Set(detectedArtists.map((a) => (a || '').trim()).filter(Boolean))];
          detectedGenres = inferGenresFromArtists(detectedArtists);
        } catch (e) {
          console.warn('⚠️ Facebook interests not available');
        }

        if (!user) {
          user = await User.create({
            facebookId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value || '',
            preferredGenres: [],
            indirectPreferences: {
              source: 'facebook',
              detectedArtists,
              detectedGenres,
              detectedAt: new Date(),
            },
            onboardingCompleted: false,
          });
        } else {
          user.facebookId = profile.id;
          user.indirectPreferences = {
            source: 'facebook',
            detectedArtists,
            detectedGenres,
            detectedAt: new Date(),
          };
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        console.error('Facebook auth error:', err);
        return done(err, null);
      }
    }
  )
);

// ========== Session ==========
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

module.exports = passport;
